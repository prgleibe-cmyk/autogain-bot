import sys
import os
import json
import threading
import warnings
import urllib3

# Adiciona o diretório de pacotes ao path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_lib_path = os.path.join(_current_dir, 'python_lib')
if _lib_path not in sys.path:
    sys.path.insert(0, _lib_path)

# Redirecionamento de logs para não quebrar o JSON
_real_stdout = sys.stdout
sys.stdout = sys.stderr

from connection_manager import ConnectionManager
from market_data_service import MarketDataService
from account_service import AccountService
from order_executor import OrderExecutor

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings("ignore")

class BridgeController:
    def __init__(self):
        self.connection = ConnectionManager()
        self.market = MarketDataService()
        self.account = AccountService(self.market)
        self.executor = OrderExecutor(self.connection, self.market)
        self.current_broker = "IQ Option"
        
        # 🔒 CONTROLE ABSOLUTO DE ORDEM ÚNICA
        self.order_lock = threading.Lock()
        self.order_in_progress = False

    def _send(self, data):
        try:
            line = json.dumps(data) + "\n"
            _real_stdout.write(line)
            _real_stdout.flush()
        except Exception as e:
            sys.stderr.write(f"Erro output: {e}\n")
            sys.stderr.flush()

    def _safe_execute(self, req_id, data):
        try:
            self.order_in_progress = True
            self.executor.execute_order(req_id, data, self._send)
        finally:
            self.order_in_progress = False

    def run(self):
        self._send({"type": "READY", "status": "online"})
        
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            
            try:
                data = json.loads(line.strip())
                req_id = data.get('request_id')
                msg_type = data.get('type')
                
                if 'broker' in data:
                    self.current_broker = data['broker']

                if msg_type == 'LOGIN':
                    self.connection.set_credentials(
                        data.get('email'),
                        data.get('password'),
                        data.get('type_acc')
                    )
                    if self.connection.ensure_connection():
                        try:
                            balance = self.account.get_balance(self.connection.api)
                        except:
                            balance = 0
                        self._send({
                            "type": "LOGIN_SUCCESS",
                            "request_id": req_id,
                            "balance": balance,
                            "assets": self.account.get_available_assets(),
                            "broker": self.current_broker
                        })
                    else:
                        self._send({
                            "type": "LOGIN_ERROR",
                            "request_id": req_id,
                            "error": "Credenciais Inválidas ou IP bloqueado."
                        })

                elif msg_type in ['DATA', 'MARKET_DATA', 'GET_MARKET_DATA']:
                    def _async_data_fetch(r_id, d):
                        if self.connection.ensure_connection():
                            results = self.market.fetch_batch_data(
                                self.connection.api,
                                d.get('assets', [])
                            )
                            self._send({
                                "type": "MARKET_DATA_RESULT",
                                "request_id": r_id,
                                "data": results
                            })
                        else:
                            self._send({
                                "type": "MARKET_DATA_RESULT",
                                "request_id": r_id,
                                "data": {},
                                "error": "Offline"
                            })
                    
                    threading.Thread(target=_async_data_fetch, args=(req_id, data), daemon=True).start()

                elif msg_type in ['BUY', 'binary', 'ORDER']:

                    if self.order_in_progress:
                        self._send({
                            "type": "ORDER_REJECTED",
                            "request_id": req_id,
                            "error": "Ordem já em execução"
                        })
                        continue

                    if not self.connection.ensure_connection():
                        self._send({
                            "type": "ORDER_ERROR",
                            "request_id": req_id,
                            "error": "Offline"
                        })
                        continue

                    threading.Thread(
                        target=self._safe_execute,
                        args=(req_id, data),
                        daemon=True
                    ).start()

                # 🔥 CORREÇÃO CRÍTICA AQUI
                elif msg_type == 'BALANCE':
                    try:
                        if not self.connection.ensure_connection():
                            self._send({
                                "type": "BALANCE_RESULT",
                                "request_id": req_id,
                                "balance": 0,
                                "error": "Offline"
                            })
                            continue

                        balance = self.account.get_balance(self.connection.api)

                        self._send({
                            "type": "BALANCE_RESULT",
                            "request_id": req_id,
                            "balance": balance
                        })

                    except Exception as e:
                        sys.stderr.write(f"Erro BALANCE: {e}\n")
                        sys.stderr.flush()
                        self._send({
                            "type": "BALANCE_RESULT",
                            "request_id": req_id,
                            "balance": 0,
                            "error": "Erro interno balance"
                        })

                elif msg_type == 'GET_ASSETS':
                    self._send({
                        "type": "GET_ASSETS_RESULT",
                        "request_id": req_id,
                        "assets": self.account.get_available_assets()
                    })

                elif msg_type == 'SWITCH':
                    success = self.connection.switch_account(
                        data.get('type_acc', 'PRACTICE')
                    )
                    self._send({
                        "type": "SWITCH_SUCCESS" if success else "SWITCH_ERROR",
                        "request_id": req_id
                    })

            except Exception as e:
                sys.stderr.write(f"Erro processamento: {e}\n")
                sys.stderr.flush()

if __name__ == "__main__":
    BridgeController().run()