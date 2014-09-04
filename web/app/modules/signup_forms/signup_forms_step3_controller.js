'use strict';

// STEP 3 ---------------------------------------------------------------------------------------------------------------------------
App.controller('SignupFormsStep3Ctrl', function ($scope, SendersService) {


    var initializeModels = function () {
        SendersService.getAllSenders().then(function (senders) {
            $scope.currentPane = ($scope.currentPane) ? $scope.currentPane : angular.copy($scope.formModel.form_languages[0].language_id);
            $scope.senders.list = senders;
        });
    };

    initializeModels();

});
