'use strict';

App.controller('SignupFormMainCtrl', function ($scope, $routeParams, FormsService, logger,  ToastService, $filter, $location, $rootScope, $anchorScroll, $timeout, PopupService, fonts, languages, senders, listName, formModel, formTemplateCategories, customFieldsList, predefinedFieldsList, formTemplates, countries, usstates, SendersService) {

    var init = function () {
        $scope.cleanedTemplate = null;
        $scope.modelDirty = false;
        $scope.customFieldsList = customFieldsList;
        $scope.predefinedFields = predefinedFieldsList;
        $scope.form_template_categories = formTemplateCategories;
        $scope.form_templates = formTemplates;
        $scope.countries = countries;
        $scope.states = usstates;
        $scope.fonts = fonts;
        $scope.languages = languages;
        $scope.senders = {
            list : senders,
            options : []
        };
        $scope.listName = listName;

        // html mode switches for confirmation and thank you emails - on/off
        $scope.htmlBodyFlags = {
            optInBodyHtml : false,
            signupBodyHtml : false ,
            optInBodyDefaultText : false,
            signupBodyDefaultText : false
        };

        //$scope.singleOptInAllowed = $scope.accountPolicy.single_optin;

        // bof in progress...
        var absUrl = $location.absUrl() + '';
        var urlArray = absUrl.split('/');
        var base = "http://"+urlArray[2]+"/";
        $scope.signupFormUrl = base + "signup/form/:id/en";
        $scope.getSignupFormUrl = function () {
            return $scope.signupFormUrl = (base + "signup/form/:id").replace(':id', $scope.formModel.id);
        };
        // eof in progress...

        $scope.formId = $routeParams['id'];
        $scope.listId = $routeParams['listId'];
        $scope.formModel = formModel.data;

        //check if html format messages
        angular.forEach($scope.formModel.form_languages, function (element, elementKey) {
            if(/<[a-z][\s\S]*>/i.test(element.opt_in_email_body)){
                $scope.htmlBodyFlags.optInBodyHtml = true;
            }
            if(/<[a-z][\s\S]*>/i.test(element.signup_email_body)){
                $scope.htmlBodyFlags.signupBodyHtml = true;
            }
        }); 

        if ($routeParams['id'] == 'new') {
            $scope.formStatus = 'new'; 

            $scope.formModel.name = null;
            delete ($scope.formModel.id);
            $scope.formModel.list_id = $scope.listId;
            
            $scope.formModel.signup_email_sender_id = _.where($scope.senders.list, {default_sender : "1"})[0] && _.where($scope.senders.list, {default_sender : "1"})[0].id;
            $scope.formModel.opt_in_email_sender_id = _.where($scope.senders.list, {default_sender : "1"})[0] && _.where($scope.senders.list, {default_sender : "1"})[0].id;
            
            $timeout(function () {
                $scope.modelDirty = false;
            }, 0);

        } else {

            $scope.formStatus = 'edit';
            $timeout(function () {
                $scope.modelDirty = true;
            }, 0);
        }
        $scope.currentPane = null;
        $scope.currentPaneIndex = 0;
        $scope.namecheck = true;
        $scope.duplicatecheck=true;
        manageTabStatus(stepStyles.step1);
        $scope.cleanedTemplate = angular.copy($scope.formModel);
    };

    $scope.$watch("formModel.form_elements", function (newFormModel, oldFormModel) {
        $scope.modelDirty = true;
    }, true);

    var firstSelection = true;
    $scope.saveAndClose = function () {
        if(!$scope.formModel.signup_email_sender_id) {
            $rootScope.showError('Please add a sender first.');  
            return; 
        } 
        if (!$scope.formModel.name) {
            $scope.goToStep('step1');
            $scope.namecheck = false;
            return;
        }
        if ($scope.formStatus == 'new') {
        	
            FormsService.createForm($scope.formModel, $scope.listId).then(function (result) {
            	if(result.status=="ERROR")
	        	{
		        	//alert("ERROR - error message");
		        	$rootScope.showError('ERROR: '+$filter('i18n')(result.message));
                    if(result.message=="duplicate_form_name") {
	            	  $scope.duplicatecheck = false;
	            	  $scope.namecheck=false;
                      $scope.goToStep('step1');
                    }
		        	return;	
	        	}
                logger.log('SignupFormMainCtrl', 'create result: ' + JSON.stringify(result));
                ToastService.success($filter('i18n')('created_form'), $scope);
                var newUrl = '/contacts/list/' + $scope.listId + '/signupforms';
                $scope.formStatus = 'edit';
                $location.path(newUrl);
            });
        } else {
            FormsService.updateForm($scope.formModel).then(function (result) {
                logger.log('SignupFormMainCtrl', 'updateForm result: ' + JSON.stringify(result));
                if(result.status=="ERROR")
	        	{
		        	//alert("ERROR - error message");
		        	$rootScope.showError('ERROR: '+$filter('i18n')(result.message));
                    if(result.message=="duplicate_form_name") {
	            	  $scope.duplicatecheck = false;
	            	  $scope.namecheck=false;
                      $scope.goToStep('step1');
                    }
		        	return;	
	        	}
                //check return
                ToastService.success($filter('i18n')('saved_form'), $scope);
                var newUrl = '/contacts/list/' + $scope.listId + '/signupforms';
                $location.path(newUrl);
            });
        }
        $scope.namecheck = true;
    };

    $scope.closePopup = function () {
        PopupService.close();
    };

    var activateForm = function () {
        var check = true;     

        SendersService.getAllSenders().then(function (senders) {
            $scope.senders.list = senders; //update senders list
        
            if ($scope.formModel.send_confirmation == "1") {
                switch ($scope.formModel.opt_in_type) {
                    case 'DOUBLE':
                        check = (_.findWhere($scope.senders.list, {
                            id: $scope.formModel.opt_in_email_sender_id
                        }).status == 'VERIFIED');
                    case 'SINGLE':
                        check = check && (_.findWhere($scope.senders.list, {
                            id: $scope.formModel.signup_email_sender_id
                        }).status == 'VERIFIED');
                        break;
                }
            }
            if (check) {
                //TODO: active form here
                $scope.formModel.active = 1;
                FormsService.updateFormStatus($scope.formModel).then(function (result) {
                    logger.log('SignupFormMainCtrl', 'updateForm result: ' + JSON.stringify(result));
                    ToastService.success($filter('i18n')('activated_form'), $scope);
                    $scope.goToStep('step4');
                });
            } else {
                $rootScope.showError($filter('i18n')('can_not_activate_sender_not_verified2'));
                //$scope.goToStep('step3');
            }
        });
            
    }

    $scope.saveForm = function () {
        PopupService.close();

        if(!$scope.formModel.opt_in_email_sender_id){
            $scope.formModel.opt_in_email_sender_id = $scope.formModel.signup_email_sender_id;   
        }
        FormsService.createForm($scope.formModel, $scope.listId).then(function (result) {
        	
        	if(result.status=="ERROR")
        	{
            	$rootScope.showError('ERROR: '+$filter('i18n')(result.message));
            	return;	
        	}

        	logger.log('SignupFormMainCtrl', 'create result: ' + JSON.stringify(result));
            ToastService.success($filter('i18n')('created_form'), $scope);
            $scope.formModel.id = result.id;
            $scope.formStatus = 'edit';
            activateForm();
        });
    };

    $scope.finishAndGetCode = function () {
        if(!$scope.formModel.signup_email_sender_id) {
            $rootScope.showError('Please add a sender first.');   
        } else {
            if ($scope.formStatus == 'new') {
                PopupService.confirm($filter('i18n')('form_not_saved'), $filter('i18n')('form_not_saved_message'), $filter('i18n')('save'), 'saveForm()', $filter('i18n')('cancel'), "closePopup()", $scope, []);
            } else {
                FormsService.updateForm($scope.formModel).then(function (result) {
                    if(result.status=="ERROR")
                    {
                        //alert("ERROR - error message");
                        $rootScope.showError('ERROR: '+$filter('i18n')(result.message));
                        if(result.message=="duplicate_form_name") {
                          $scope.duplicatecheck = false;
                          $scope.namecheck=false;
                          $scope.goToStep('step1');
                        }
                        return; 
                    }
                    logger.log('SignupFormMainCtrl', 'updateForm result: ' + JSON.stringify(result));
                    activateForm();
                });            
            }   
        }
    };

    $scope.returnToForms = function () {
        var newUrl = '/contacts/list/' + $scope.listId + '/signupforms';
        $location.path(newUrl);   
    };

    $scope.addNewLanguage = function (value, defaultLangId) {
        $scope.pushLanguage(value + '', defaultLangId);
        PopupService.close();
        $scope.currentPane = value;
    };

    $scope.cancelAddNewLanguage = function (oldDefault) {
        $scope.formModel.default_language_id = oldDefault + '';
        PopupService.close();
    };

    $scope.$watch('formModel.default_language_id', function (value, oldDefault) {
        if (_.where($scope.formModel.form_languages, {
            language_id: value
        }).length == 0 && !firstSelection) {
            var language = _.findWhere($scope.languages, {
                id: value
            });
            var languageName = language.name;

            PopupService.confirm($filter('i18n')('language_not_present'), $filter('i18n')('add_new_language_message', {
                language: languageName
            }), $filter('i18n')('add'), 'addNewLanguage(' + value + ',' + oldDefault + ')', $filter('i18n')('cancel'), "cancelAddNewLanguage(" + oldDefault + ")", $scope, []);

        } else {
            firstSelection = false;
            $scope.currentPane = value;
        }
    });

    // Reset message for every language for opt-in mails if htmlMode on and reset html messages when htmlMode off
    $scope.$watch('htmlBodyFlags', function(newValue, oldValue) {
        if(newValue['optInBodyHtml'] == true && oldValue['optInBodyHtml'] == false) {
            angular.forEach($scope.formModel.form_languages, function (element, elementKey) {
                if(!/<[a-z][\s\S]*>/i.test(element.opt_in_email_body)){
                    element.opt_in_email_body = '';    
                }                    
            });    
        }
        if(newValue['optInBodyHtml'] == false && oldValue['optInBodyHtml'] == true) {
            angular.forEach($scope.formModel.form_languages, function (element, elementKey) {
                if(/<[a-z][\s\S]*>/i.test(element.opt_in_email_body) || element.opt_in_email_body==''){
                    if(newValue['optInBodyDefaultText'] || element.opt_in_email_body==''){
                        FormsService.getDefaultTextByLanguage(element.language_id).then(function(result){
                            element.opt_in_email_body = result.opt_in_email_body;
                        });    
                    } else {
                        element.opt_in_email_body = $filter('html2text')(element.opt_in_email_body);      
                    }                     
                }                    
            });    
        }
        if(newValue['signupBodyHtml'] == true && oldValue['signupBodyHtml'] == false) {
            angular.forEach($scope.formModel.form_languages, function (element, elementKey) {
                if(!/<[a-z][\s\S]*>/i.test(element.signup_email_body)){
                    element.signup_email_body = '';    
                }    
            });    
        }
        if(newValue['signupBodyHtml'] == false && oldValue['signupBodyHtml'] == true) {
            angular.forEach($scope.formModel.form_languages, function (element, elementKey) {
                if(/<[a-z][\s\S]*>/i.test(element.signup_email_body) || element.signup_email_body==''){
                    if(newValue['signupBodyDefaultText'] || element.signup_email_body==''){
                        FormsService.getDefaultTextByLanguage(element.language_id).then(function(result){
                            element.signup_email_body = result.signup_email_body;
                        });    
                    } else {
                        element.signup_email_body = $filter('html2text')(element.signup_email_body);        
                    }      
                }    
            });    
        }
    }, true);

    $scope.pushLanguage = function (newLanguage, defaultLangId) {
        if (newLanguage && newLanguage != -1) {
            
            $scope.idle = false;
            var languageId = -1;
            if(defaultLangId) {
                languageId = defaultLangId;  
            } else {
                languageId = $scope.formModel.default_language_id;
            }

            FormsService.getDefaultTextByLanguage(newLanguage).then(function(result){
                //reset mail message if htmlMode ON
                if($scope.htmlBodyFlags.optInBodyHtml){
                    result.opt_in_email_body = '';
                }
                if($scope.htmlBodyFlags.signupBodyHtml){
                    result.signup_email_body = '';
                }
                $scope.formModel.form_languages.push(result);

                $scope.currentPane = newLanguage;
            });

   
            // formLanguageItem.language_id = newLanguage;
            // $scope.formModel.form_languages.push(angular.copy(formLanguageItem));
            angular.forEach($scope.formModel.form_elements, function (form_element, form_elementKey) {
                var elementLanguageItem = angular.copy(_.findWhere(form_element.form_element_languages, {
                    language_id: languageId  + ''
                }));
                elementLanguageItem.language_id = newLanguage;
                $scope.formModel.form_elements[form_elementKey].form_element_languages.push(elementLanguageItem);
            });
            //end developing
        }
        $scope.newLanguage = -1;
    };

    $scope.checkActivePane = function (pane) {
        return (pane && pane.language_id == $scope.currentPane) ? 'active active-pane' : '';
    };

    $scope.deleteLang = function (languageNdx) {
        if ($scope.formModel.form_languages[languageNdx] && $scope.formModel.form_languages[languageNdx].language_id != $scope.formModel.default_language_id) {
            $scope.formModel.form_languages.splice(languageNdx, 1);
            //TODO: delete fields language elements
            $scope.currentPane = angular.copy($scope.formModel.default_language_id);
            angular.forEach($scope.formModel.form_elements, function (form_element, form_elementKey) {
                $scope.formModel.form_elements[form_elementKey].form_element_languages.splice(languageNdx, 1);
            });
        }
    };

    $scope.getLangOptions = function () {
        var languages = angular.copy($scope.languages);
        var index = null;
        angular.forEach($scope.formModel.form_languages, function (form_language, form_languageKey) {
            angular.forEach(languages, function (language, languageKey) {
                if (language.id == form_language.language_id) {
                    languages.splice(languageKey, 1);
                }
            });
        });
        return languages;
    };

    $scope.cancelAddLang = function () {
        $scope.idle = false;
        $scope.newLanguage = -1;
    };

    $scope.addLang = function () {
        $scope.idle = true;
        $scope.newLanguage = -1;
    };

    $scope.select = function (pane) {
        $scope.currentPane = pane.language_id;
    };

    $scope.$watch("currentPane", function (id) {
        var found = false;
        _.each($scope.formModel.form_languages, function (el, index) {
            if (el.language_id == id) {
                found = true;
                $scope.currentPaneIndex = index;
            }
        });
        if (!found) {
            $scope.currentPaneIndex = -1;
        }
    });

    $scope.getLangCode = function (langId) {
        return _.findWhere($scope.languages, {
            id: langId
        }).code;
    };

    $scope.getLangName = function (langId) {
        return _.findWhere($scope.languages, {
            id: langId
        }).name;
    };


    var stepStyles = {
        step1: {
            title: $filter('i18n')("Main settings"),
            stepStyle: "25%",
            barStyle: "75%",
            activeStep: 'step1'

        },
        step2: {
            title: $filter('i18n')("Design form"),
            stepStyle: "50%",
            barStyle: "50%",
            activeStep: 'step2'

        },
        step3: {
            title: $filter('i18n')("Subscription preferences"),
            stepStyle: "75%",
            barStyle: "25%",
            activeStep: 'step3'

        },
        step4: {
            title: $filter('i18n')("Get the code"),
            stepStyle: "100%",
            barStyle: "0%",
            activeStep: 'step4'
        }
    };

    var manageTabStatus = function (style) {
        $scope.currentStepTitle = style.title;
        $scope.stepStyle = {
            width: style.stepStyle
        };
        $scope.barStyle = {
            width: style.barStyle
        };
        $scope.stepStyle['step1'] = $scope.stepStyle['step2'] = $scope.stepStyle['step3'] = $scope.stepStyle['step4'] = "";
        $scope.stepStyle[style.activeStep] = "active";
        $scope.formWizardStep = style.activeStep;
        $anchorScroll();
    };

    $scope.goToStep = function (step) {
        $scope.namecheck = ($scope.formModel.name) ? true : false;
        $scope.currentPane = $scope.formModel.default_language_id;
        switch (step) {
            case 'step1':
                manageTabStatus(stepStyles.step1);
                break;
            case 'step2':
                if ($scope.formModel.name && $scope.formModel.name != '')
                    manageTabStatus(stepStyles.step2);

                break;
            case 'step3':
                if ($scope.formModel.name && $scope.formModel.name != '')
                    manageTabStatus(stepStyles.step3);
                break;
            case 'step4':
                if ($scope.formModel.name && $scope.formModel.name != '')
                    manageTabStatus(stepStyles.step4);
                break;
        }
    };
    $scope.getTemplate = function (template_id) {
        FormsService.getFormTemplate(template_id).then(function (template) {
            if (template) {
                $scope.formModel.page_bg_style = angular.copy(template.page_bg_style);
                $scope.formModel.page_fg_style = angular.copy(template.page_fg_style);
                $scope.formModel.form_bg_style = angular.copy(template.form_bg_style);
                $scope.formModel.form_bg_style1 = angular.copy(template.form_bg_style1);
                $scope.formModel.form_fg_style = angular.copy(template.form_fg_style);
                $scope.formModel.label_font_id = angular.copy(template.label_font_id);
                $scope.formModel.label_font_size = angular.copy(template.label_font_size);
                $scope.formModel.input_font_id = angular.copy(template.input_font_id);
                $scope.formModel.input_font_size = angular.copy(template.input_font_size);
                $scope.formModel.text_font_id = angular.copy(template.text_font_id);
                $scope.formModel.text_font_size = angular.copy(template.text_font_size);
                $scope.formModel.form_elements = angular.copy(template.form_elements);
                angular.forEach($scope.formModel.form_elements, function (formElement, formElementKey) {
                    var formElementDefaultLanguage = template.form_elements && template.form_elements[formElementKey].form_element_languages && template.form_elements[formElementKey].form_element_languages[0];
                    $scope.formModel.form_elements[formElementKey].form_element_languages = [];
                    angular.forEach($scope.formModel.form_languages, function (language) {
                        formElementDefaultLanguage.language_id = language && language.language_id;
                        if (formElementDefaultLanguage)
                            $scope.formModel.form_elements[formElementKey].form_element_languages.push(angular.copy(formElementDefaultLanguage));
                    });
                });
                $scope.cleanedTemplate = angular.copy(template);
                $timeout(function () {
                    $scope.modelDirty = false;
                }, 0);
            }
        });
    };

    $scope.confirmGetTemplate = function (template_id) {
        $scope.getTemplate(template_id);
        $scope.closePopup();
    };
    $scope.templateCarouselActions = {
        selectTemplate: function (template_id) {
            // check if the model is dirty
            if ($scope.modelDirty) {// && angular.equals($scope.formModel, $scope.cleanedTemplate)) {
                PopupService.confirm($filter('i18n')('form_modified'), $filter('i18n')('form_modified_message'), $filter('i18n')('replace'), 'confirmGetTemplate(' + template_id + ')', $filter('i18n')('cancel'), "closePopup()", $scope, []);
            } else {
                $scope.getTemplate(template_id);
                
            }
        }
    };
    init();
});