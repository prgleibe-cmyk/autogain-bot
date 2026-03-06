
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

    def _log(self, msg):
        sys.stderr.write(f"[ConnectionManager] {msg}\n")
        sys.stderr.flush()

    def set_credentials(self, email, password, account_type):
        self.email = email
        self.password = password
        self.account_type = account_type if account_type else "PRACTICE"

    def ensure_connection(self):
        """
        Check and silent recovery.
        """
        with self.lock:
            try:
                if self.api and self.api.check_connect():
                    return True
            except:
                pass
            return self._reconnect()

    def _reconnect(self):
        if not self.email or not self.password:
            return False

        if self.is_reconnecting:
            return False

        self.is_reconnecting = True
        self._log("Tentando estabelecer nova sessao...")
        
        try:
            # Cleanup anterior
            if self.api:
                try:
                    # Tenta fechar de forma não bloqueante
                    self.api.websocket.close()
                except:
                    pass
                self.api = None

            self.api = IQ_Option(self.email, self.password)
            # Remove qualquer print interno redirecionando temporariamente o stdout
            check, reason = self.api.connect()

            if check:
                self.api.change_balance(self.account_type)
                self._log(f"Sessao ativa ({self.account_type}).")
                self.is_reconnecting = False
                return True
            else:
                self._log(f"Falha connect: {reason}")
                self.is_reconnecting = False
                return False
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
                except:
                    pass
            
            return self._reconnect()
