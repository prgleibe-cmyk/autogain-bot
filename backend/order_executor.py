import time
import sys
import threading


class OrderExecutor:
    def __init__(self, connection_manager, market_service):
        self.connection_manager = connection_manager
        self.market_service = market_service

    def _log(self, msg):
        sys.stderr.write(f"[OrderExecutor] {msg}\n")
        sys.stderr.flush()

    def execute_order(self, req_id, data, send_callback):
        try:
            # 🔒 Garantir conexão ativa
            if not self.connection_manager.ensure_connection():
                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "status": "error",
                    "order_id": None,
                    "message": "Sessao indisponivel ou offline"
                })
                return

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
                try:
                    status, order_id = api.buy(amount, primary, action, 1)
                except Exception as e:
                    self._log(f"Erro no disparo primario ({primary}): {e}")
                    status, order_id = False, "error"

                if (not status or order_id == "error") and fallback:
                    self._log(f"Ativo {primary} indisponivel. Tentando fallback para {fallback}")
                    try:
                        status, order_id = api.buy(amount, fallback, action, 1)
                        primary = fallback
                    except Exception as e:
                        self._log(f"Erro no disparo fallback ({fallback}): {e}")
                        status, order_id = False, "error"

            if not status or order_id == "error":
                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "status": "error",
                    "order_id": order_id if isinstance(order_id, int) else None,
                    "message": f"Falha no disparo: {order_id}"
                })
                return

            self._log(f"Ordem {order_id} aberta em {primary} com valor {amount}. Monitorando resultado...")
            
            # 🔥 2. Iniciar monitoramento em thread (Background)
            # Isso garante que a função retorne imediatamente ao bridge
            monitor_thread = threading.Thread(
                target=self._monitor_order,
                args=(req_id, order_id, primary, amount, send_callback),
                daemon=True
            )
            monitor_thread.start()

            # 🔥 3. Retornar imediatamente ao bridge
            return

        except Exception as e:
            self._log(f"Erro CRITICO no disparo da ordem: {e}")
            send_callback({
                "type": "ORDER_RESULT",
                "request_id": req_id,
                "status": "error",
                "order_id": None,
                "message": f"Erro fatal ao abrir ordem: {str(e)}"
            })
            return

    def _monitor_order(self, req_id, order_id, primary, amount, send_callback):
        # 🔥 Monitoramento seguro com check_win_v3
        start_time = time.time()
        timeout_limit = 120

        while True:
            elapsed = time.time() - start_time

            # ⏰ Timeout garantido (120s)
            if elapsed > timeout_limit:
                self._log(f"Timeout (120s) na ordem {order_id}. Finalizando com erro.")
                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "status": "error",
                    "order_id": order_id,
                    "message": "Timeout: Resultado nao obtido em 120s"
                })
                break

            try:
                result = None

                try:
                    # ✅ NÃO BLOQUEANTE
                    result = self.connection_manager.api.check_win_v3(order_id)
                except Exception as internal_error:
                    self._log(f"check_win_v3 falhou: {internal_error}")
                    # Se falhar internamente, tentamos novamente ate o timeout

                if result is not None:
                    resultado_str = "win" if result > 0 else "loss"

                    with self.connection_manager.lock:
                        final_balance = self.connection_manager.api.get_balance()

                    send_callback({
                        "type": "ORDER_RESULT",
                        "request_id": req_id,
                        "order_id": order_id,
                        "result": resultado_str,
                        "profit": result,
                        "data": {
                            "id": order_id,
                            "status": resultado_str.upper(),
                            "profit": result,
                            "asset": primary
                        },
                        "balance": final_balance
                    })
                    break

            except Exception as e:
                self._log(f"Erro fatal no monitoramento: {e}")
                send_callback({
                    "type": "ORDER_RESULT",
                    "request_id": req_id,
                    "status": "error",
                    "order_id": order_id,
                    "message": f"Erro no monitoramento: {str(e)}"
                })
                break

            time.sleep(1)
