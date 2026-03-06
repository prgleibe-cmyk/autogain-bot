import time
import sys


class OrderExecutor:
    def __init__(self, connection_manager, market_service):
        self.connection_manager = connection_manager
        self.market_service = market_service

    def _log(self, msg):
        sys.stderr.write(f"[OrderExecutor] {msg}\n")
        sys.stderr.flush()

    def execute(self, req_id, data, send_callback):

        # 🔒 Garantir conexão ativa
        if not self.connection_manager.ensure_connection():
            send_callback({
                "type": "ORDER_RESULT",
                "request_id": req_id,
                "error": "Sessao indisponivel ou offline"
            })
            return

        try:
            asset_raw = data.get('asset', 'EURUSD').replace("-", "").replace("/", "").upper()

            if 'amount' not in data:
                raise ValueError("Amount não informado pelo frontend")

            amount = float(data.get('amount'))
            if amount <= 0:
                raise ValueError("Amount deve ser maior que zero")

            action = data.get('action', 'call').lower()

            primary = self.market_service.asset_map.get(asset_raw, asset_raw)
            fallback = primary + "-OTC" if "-OTC" not in primary else None

            # 🔒 LOCK apenas para abrir ordem
            with self.connection_manager.lock:
                api = self.connection_manager.api
                status, order_id = api.buy(amount, primary, action, 1)

                if (not status or order_id == "error") and fallback:
                    self._log(f"Ativo {primary} indisponivel. Tentando fallback para {fallback}")
                    status, order_id = api.buy(amount, fallback, action, 1)
                    primary = fallback

            if not status or order_id == "error":
                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "error": f"Rejeitado: {order_id}"
                })
                return

            self._log(f"Ordem {order_id} aberta em {primary} com valor {amount}. Monitorando resultado...")

        except Exception as e:
            self._log(f"Erro no disparo da ordem: {e}")
            send_callback({
                "type": "ORDER_RESULT",
                "request_id": req_id,
                "error": str(e)
            })
            return

        # 🔥 Monitoramento seguro com check_win_v3
        start_time = time.time()
        timeout_limit = 75

        while True:

            elapsed = time.time() - start_time

            # ⏰ Timeout garantido
            if elapsed > timeout_limit:
                self._log(f"Timeout na ordem {order_id}. Forçando LOSS seguro.")

                with self.connection_manager.lock:
                    final_balance = self.connection_manager.api.get_balance()

                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "data": {
                        "id": order_id,
                        "status": "LOSS",
                        "profit": 0,
                        "asset": primary
                    },
                    "balance": final_balance
                })
                break

            try:
                result = None

                try:
                    # ✅ NÃO BLOQUEANTE
                    result = self.connection_manager.api.check_win_v3(order_id)
                except Exception as internal_error:
                    self._log(f"check_win_v3 falhou: {internal_error}")

                if result is not None:
                    resultado = "WIN" if result > 0 else "LOSS"

                    with self.connection_manager.lock:
                        final_balance = self.connection_manager.api.get_balance()

                    send_callback({
                        "type": "ORDER_RESULT",
                        "request_id": req_id,
                        "data": {
                            "id": order_id,
                            "status": resultado,
                            "profit": result,
                            "asset": primary
                        },
                        "balance": final_balance
                    })
                    break

            except Exception as e:
                self._log(f"Erro geral no monitoramento: {e}")

                with self.connection_manager.lock:
                    if not self.connection_manager.api.check_connect():
                        self._log("Reconectando sessão...")
                        self.connection_manager.ensure_connection()

            time.sleep(1)