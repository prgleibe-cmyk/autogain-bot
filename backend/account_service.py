class AccountService:
    def __init__(self, market_service):
        self.market_service = market_service

    def get_balance(self, api_instance):
        if not api_instance:
            return 0
        try:
            return api_instance.get_balance()
        except:
            return 0

    def get_available_assets(self):
        return self.market_service.get_safe_assets()
