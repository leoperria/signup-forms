'use strict';

// STEP 4 ---------------------------------------------------------------------------------------------------------------------------
App.controller('SignupFormsStep4Ctrl', function ($scope, FormsService) {

    $scope.formHostingUrl = ($scope.formStatus == 'edit') ? $scope.getSignupFormUrl() : '';
    $scope.formMarkUp = false;

    if ($scope.formStatus == 'edit'){
        FormsService.getFormMarkup($scope.formModel.id).then(function (result) {
            $scope.formMarkUp = result.data;

        });   
    }
       

});

