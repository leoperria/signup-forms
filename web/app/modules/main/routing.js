'use strict';

App.config(['$routeProvider',

function($routeProvider) {
	$routeProvider.when('/settings', {
		controller : 'SettingsCtrl',
		templateUrl : 'modules/settings/views/settings.html',
		resolve : {
			senders : function(SendersService) {
				return SendersService.getAllSenders();
			},
			canspamaddress : function(CanSpamAddressService){
				return CanSpamAddressService.getAddress();
			},
			countries : function (Countries) {
                return Countries.query().$promise;
            }
		}
	}).otherwise({
		redirectTo : '/dashboard'
	});
}]);
