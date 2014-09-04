'use strict';

// List of signup forms
App.controller('SignupFormsCtrl', function ($scope, PopupService, FormsService, ToastService, $filter, $routeParams, ContactListsService, $rootScope) {

    var init = function () {
        $scope.listId = $routeParams['listId'];
        $scope.signupformsParameters = {};
        $scope.formsListStatus = "loading";

        ContactListsService.getListNameFromId($routeParams['listId']).then(function (name) {
            $scope.listName = name;
        });
        FormsService.listId = $routeParams['listId'];
        
        $scope.signupformsParameters.listId = $scope.listId;
        
        // data source for grid 1.2 directive
        $scope.signupformsDatasource = FormsService.signupformsDatasource;
        
        // if queryString == '' all blockings will be listed
        $scope.signupformsDatasource.setUrlParams({
            ":list_id" : FormsService.listId
        });
        // load data and counters
        $scope.signupformsDatasource.model.pageSize = 10;
        $scope.signupformsDatasource.loadPage(1).then(function(data){
            $scope.formsListStatus = (parseInt(data.model.totalElements) > 0) ? "populated" : "empty";    
        });

        $scope.signupformsActions = {
            removeForm: function (formId, formName) {
                PopupService.close();
                FormsService.deleteSignupForm(formId).then(function (response) {
                    ToastService.success($filter('i18n')('removed_form', {form: formName}), $scope);
                    $scope.signupformsDatasource.refresh().then(function(){
                        $scope.formsListStatus = (parseInt($scope.signupformsDatasource.model.totalElements) > 0) ? "populated" : "empty";    
                    });
                });
            },
            updateForm: function (formModel) {
                PopupService.close();
                var formModelToSend = angular.copy(formModel);
                if (formModel.active == "1") {
                    formModelToSend.active = "0";
                } else if (formModel.active == "0") {
                    formModelToSend.active = "1";
                }
                FormsService.updateFormStatus(formModelToSend).then(function (response) {  //FIXME better messages
                    if (response.status == 'OK') {
                        ToastService.success($filter('i18n')('updated_form', {form: formModel.name}), $scope);
                        $scope.signupformsDatasource.refresh();
                    } else if (response.message == 'sender_not_verified') {
                        $rootScope.showError($filter('i18n')('can_not_activate_sender_not_verified', {link: '#/settings'})); //FIXME url
                    }
                });
            },
            cancel: function () {
                PopupService.close();
            }
        };
    };
    // scope methods:
    init();
});