'use strict';

App.service('FormsService', function ($http, BASE_PATH, SpinnerService, GridDatasourceBase) {
    this.formsUrl = BASE_PATH + "/forms/:id";
    this.formMarkupUrl = BASE_PATH + "/forms/:id/markup";
    this.formlistUrl = BASE_PATH + "/lists/:list_id/forms";
    this.formsCountUrl = BASE_PATH + "/lists/:list_id/forms/count";
    this.getTemplateUrl = BASE_PATH + "/meta/formtemplates/:id";
    this.defaultLanguageTextUrl = BASE_PATH + "/formdefaulttext/:id";
    this.updateTemplatePreviewUrl = BASE_PATH + "/forms/:id/emailpreview";

    var self = this;
    self.listId = -1;

    this.getForm = function (id) {
        return $http({
            method: "GET",
            url: self.formsUrl.replace(':id', id)
        }).then(function success(result) {
                return {
                    data: result.data[0],
                    status: result.status
                };
            }, function error(result) {
                return {
                    status: result.status
                };
            });
    };

    this.getFormsCount = function () {
        return $http({
            method: "GET",
            url: self.formsCountUrl.replace(':list_id', self.listId)
        }).then(function (result) {

                return result.data.totalcount;
            });
    };

    this.getFormTemplate = function (id) {
        SpinnerService.on();
        return $http({
            method: "GET",
            url: self.getTemplateUrl.replace(':id', id)
        }).then(function success(result) {
                SpinnerService.off();
                return result.data[0];
            }, function error(result) {
                SpinnerService.off();
                return {
                    status: result.status
                };
            });
    };

    this.updateForm = function (model) {
        SpinnerService.on();
        return $http({
            method: "PUT",
            data: model,
            url: self.formsUrl.replace(':id', model.id)
        }).then(function success(result) {
                SpinnerService.off();
                return result.data;
            });
    };

    this.updateFormStatus = function (model) {
        SpinnerService.on();
        return $http({
            method: "PUT",
            data: model,
            url: self.formsUrl.replace(':id', model.id) + '/status'
        }).then(function success(result) {
                SpinnerService.off();
                return result.data;
            });
    };

    this.createForm = function (model, listId) {
        SpinnerService.on();
        return $http({
            method: "POST",
            data: model,
            url: self.formlistUrl.replace(':list_id', listId)
        }).then(function success(result) {
                SpinnerService.off();
                return result.data;
            });
    };

    this.getFormMarkup = function (formId) {
        SpinnerService.on();
        return $http({
            method: "GET",
            url: self.formMarkupUrl.replace(':id', formId)
        }).then(function (result) {
                SpinnerService.off();
                return result.data;
            });
    };

    this.deleteSignupForm = function (formId) {
        SpinnerService.on();
        return $http({
            method: "DELETE",
            url: self.formsUrl.replace(':id', formId)
        }).then(function (result) {
                SpinnerService.off();
                return result.data;
            });
    };

    this.getDefaultTextByLanguage = function(languageId) {
        SpinnerService.on();
        return $http({
            method: "GET",
            url: self.defaultLanguageTextUrl.replace(':id', languageId)
        }).then(function (result) {
                SpinnerService.off();
                return result.data;
            });    
    }

    this.updateTemplatePreview = function(formId, message, style) {
        SpinnerService.on();
        return $http({
            method: "PUT",
            data : {
                'message' : message,
                'style' : style
            },
            url: self.updateTemplatePreviewUrl.replace(':id', formId)
        }).then(function (result) {
                SpinnerService.off();
                return result.data.mail;
            });      
    }

    var SignupFormsDatasource = GridDatasourceBase.extend({});
    this.signupformsDatasource = new SignupFormsDatasource(self.formlistUrl, self.formsCountUrl);

});


App.factory("FormTemplateCategories",
    function (BASE_PATH, $resource) {
        return $resource(BASE_PATH + "/meta/formtemplatecategories", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
);

App.factory("FormTemplates",
    function (BASE_PATH, $resource) {
        return $resource(BASE_PATH + "/meta/formtemplates/:id", {id: '@id'}, {
                query: {method: 'GET', isArray: true, cache: true}
            }
        );
    }
);
