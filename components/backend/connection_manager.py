import threading
import time
import sys
from iqoptionapi.stable_api import IQ_Option


class ConnectionManager:
    def __init__(self):
        self.api = None
        self.email = None
        self.password = None
        self.account_type = "PRACTICE"
        self.lock = threading.Lock()
        self.is_reconnecting = False
        self.last_connect_time = 0

    def _log(self, msg):
        sys.stderr.write(f"[ConnectionManager] {msg}\n")
        sys.stderr.flush()

    def set_credentials(self, email, password, account_type):
        self.email = email
        self.password = password
        self.account_type = account_type if account_type else "PRACTICE"

    def ensure_connection(self):
        with self.lock:
            if self.api and self.api.check_connect():
                return True

            self._log("Conexao inconsistente detectada. Forcando reconexao.")
            return self._reconnect()

    def _reconnect(self):
        if not self.email or not self.password:
            return False

        now = time.time()
        if now - self.last_connect_time < 2:
            return False

        if self.is_reconnecting:
            return False

        self.is_reconnecting = True
        self.last_connect_time = now

        self._log("Tentando estabelecer nova sessao...")

        try:
            if self.api:
                try:
                    self.api.close()
                except Exception:
                    pass
                self.api = None

            time.sleep(1)

            self.api = IQ_Option(self.email, self.password)

            check, reason = self.api.connect()

            if not check:
                self._log(f"Falha connect: {reason}")
                self.is_reconnecting = False
                return False

            time.sleep(2)

            self.api.change_balance(self.account_type)

            self._log(f"Sessao ativa ({self.account_type}).")
            self.is_reconnecting = False
            return True

        except Exception as e:
            self._log(f"Erro no fluxo iq_connect: {e}")
            self.is_reconnecting = False
            return False

    def switch_account(self, account_type):
        with self.lock:
            if account_type == 'REAL':
                self.account_type = 'REAL'
            else:
                self.account_type = 'PRACTICE'

            if self.api and self.api.check_connect():
                try:
                    self.api.change_balance(self.account_type)
                    return True
                except Exception:
                    pass

            return self._reconnect()

    # =========================
    # LISTAR ATIVOS ABERTOS
    # =========================
    def get_open_assets(self):
        """
        Retorna lista de ativos digitais abertos.
        Não altera fluxo de conexão.
        """
        with self.lock:
            if not self.ensure_connection():
                self._log("Nao foi possivel obter ativos: sem conexao.")
                return []

            try:
                all_assets = self.api.get_all_open_time()
                open_assets = []

                if "digital" in all_assets:
                    for asset, data in all_assets["digital"].items():
                        if data.get("open"):
                            open_assets.append(asset)

                self._log(f"Ativos digitais abertos encontrados: {len(open_assets)}")
                return open_assets

            except Exception as e:
                self._log(f"Erro ao buscar ativos: {e}")
                return []

    # =========================
    # NOVO MÉTODO – MARKET DATA SEGURO
    # =========================
    def get_market_data(self, asset, timeframe=60, count=60):
        """
        Busca candles com subscribe adequado
        para evitar retorno de dados vazios.
        Não altera login nem reconexão.
        """
        with self.lock:
            if not self.ensure_connection():
                self._log("Sem conexao para buscar dados.")
                return []

            try:
                # Subscribe no ativo
                self.api.subscribe_strike_list(asset, timeframe)

                # Pequena espera para buffer estabilizar
                time.sleep(1.5)

                candles = self.api.get_candles(
                    asset,
                    timeframe,
                    count,
                    time.time()
                )

                # Unsubscribe após leitura
                self.api.unsubscribe_strike_list(asset, timeframe)

                if not candles:
                    self._log(f"Dados vazios para {asset}")
                    return []

                return candles

            except Exception as e:
                self._log(f"Erro ao buscar dados {asset}: {e}")
                return []