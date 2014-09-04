'use strict';

App.directive('formcarousel', [
function() {
	return {
		restrict : 'EA',
		transclude : true,
		scope : {
			templates : "=",
			actions : "="
		},
		compile : function compile(carousel, attrs, transclude) {
			return {
				// TODO: clean the code !!! dirty version!!!
				post : function postLink(scope, carousel, attrs, controller) {
					var innerCarousel = carousel.find('.inner-carousel');
					var templateList = carousel.find('.templates-list');
					var templates = carousel.find('.templates');
					var templateListWidth = templateList.width();
					var innerWidth = parseInt(innerCarousel.width()) - 30;
					templates.bind('resize', function() {
						$scope.$apply(function() {
						});
					});
					scope.$watch('templates', function() {
						var templateWidth = 137 * (scope.templates.length);
						carousel.find('.templates-list').css('width', '2000px !important');
						carousel.find('.templates').width(templateWidth + 'px');
						templateListWidth = templateWidth;
						templateList.css("left", 0);
					});

					scope.prevTemplate = function() {
						var left = parseInt(templateList.position().left) + 100;
						templateList.css("left", (left > 0 ) ? 0 : left);
					};
					scope.nextTemplate = function() {
						if (innerWidth < templateListWidth) {
							var left = parseInt(templateList.position().left) - 120;
							templateList.css("left", (left - innerWidth < -templateListWidth  ) ? innerWidth - templateListWidth : left);
						}
					};
				}
			};
		},
		template : '<div class="carousel">' + '<div class="inner-carousel">' + '<div class="templates">' + '<ul class="row-fluid templates-list">' + '<li ng-repeat="template in templates" class="template">' + '<a ng-click="actions.selectTemplate(template.id);" class="thumbnail" ><img ng-src="{{template.thumbnail}}"></a>' + '</li>' + '</ul>' + '</div>' + '<a class="a-left cycle-prev" ng-click="prevTemplate();"><i class="arrow-left"></i></a>' + '<a class="a-right cycle-next" ng-click="nextTemplate();"><i class="arrow-right"></i></a>' + '</div>' + '</div>',
		replace : true
	};
}]);

/* handles signup confirm email and thank you email in signup form UI step 3 */
App.directive('signupFormEmail', function (BASE_PATH, $rootScope, PopupService, $filter, FormsService, $routeParams, EmailPreviewService) {
    return {
        restrict: 'EA',
        
        scope: {
            sender : '=',
            senders : '=',
            subject : '=',
            body : '=',
            mailStyle : '=',
            fonts : '=',
            htmlMode : '=',
            defaultTextFlag : '='
        },
        templateUrl: 'modules/contacts/signup_forms/views/signup_form_email.tpl.html',
        replace: true,
        link: function (scope, element, attrs) {

            var uploadCanceled = false;

            if(!scope.mailStyle){
                //default colors
                scope.mailStyle = {
                    mail_background_color : "#00b3d8",
                    mail_link_color : "#ffffff",
                    mail_button_color : "#ff7b13",
                    mail_text_color : "#ffffff",
                    mail_logo_position : "left",
                    mail_font : "3", //Arial
                    mail_font_size : "15"
                };
            }

            /* begin of image upload handling */
            scope.filedata = {};
            scope.filedata.file = null;
            scope.filedata.promise = null; 

            $(element).find('#addButton').click(function(){
                $(this).parent().find('#fileUpload').click();
            });

            $(element).fileupload({
                url : BASE_PATH + '/resourcelink?type=image',
                paramName :  'file',
                autoUpload: false,
                start: function() {
                    //console.log("start fileupload");
                    $('#upload-modal').modal();
                },
                beforeSend: function(xhr, settings) {
                    xhr.setRequestHeader("authkey", $rootScope.authkey);
                },
                error: function(xhr, settings) {
                    //console.log("error");
                    if(!uploadCanceled) {
                        PopupService.alert($filter('i18n')('Error'), $filter('i18n')('upload_failed'), $filter('i18n')('OK'), "", {}, null);
                        $('#upload-modal').modal('hide');   
                    }     
                    scope.$apply(scope.removeLogo());                
                },
                done: function(e, data) {   
                    $('#upload-modal').modal('hide');
                    if(data.result.message=='not_image') {
                        PopupService.alert($filter('i18n')('Error'), $filter('i18n')('please upload an image file'), $filter('i18n')('OK'), "", {}, null);  
                        scope.$apply(scope.removeLogo());
                    } else {
                        console.log("done uploading image.");
                        scope.$apply(function () {
                            scope.mailStyle.mail_logo_url = data.result.url;
                        });    
                    }      
                }             
            });
            
            scope.cancelUpload = function (evt) {
                uploadCanceled = true;
                $('#upload-modal').modal('hide');
                scope.filedata.file.abort();  
            };

            scope.submitUpload = function() { 
                scope.filedata.promise = scope.filedata.file.submit();     
            };

            $(element).bind('fileuploadadd', function(e, data){
                // Add the file to the list 
                scope.filedata.file=data;
                var file = data.files[data.files.length-1];
                scope.fileList = [];
                scope.$apply(scope.fileList.push({name: file.name}));
            });

            /* end of image upload handling */

            /* from custom logo mode to plain text mode */
            scope.removeLogo = function() {
                scope.mailStyle.mail_logo_url = undefined;
                scope.filedata = {};
	            scope.filedata.file = null;
	            scope.filedata.promise = null; 
	            scope.fileList = [];
            };

            /* from custom html mode to plain text mode 1 */
            scope.stripHtml = function() {
                scope.htmlMode = false;
                scope.defaultTextFlag = false;
            };

            /* from custom html mode to plain text mode 2 */
            scope.loadDefaultTexts = function() {
                scope.htmlMode = false;
                scope.defaultTextFlag = true;
            };

            /* from plain text mode or custom logo mode to custom html mode */
            scope.switchToHtmlMode = function() {
                scope.htmlMode = true; 
                scope.removeLogo();
                //htmlMode flag is monitored in main controller to reset messages from other languages and from future add languages  
                PopupService.close();                  
            };

            /* show custom html preview */
            scope.showPreview = function() {
                EmailPreviewService.showPreview(scope.body);
            };

            /* update custom logo mode preview or switch to html mode according to message or mail style values changing */
            var reactFunction = function(newValue, oldValue) {
                //htmlMode handling
                if(/<[a-z][\s\S]*>/i.test(newValue[1]) && !/<[a-z][\s\S]*>/i.test(oldValue[1])){
                    //html detected
                    //popup warning - confirm
                    if(!scope.htmlMode) {
                        PopupService.alert('Warning', 'HTML code detected. You will need to define your custom HTML mail message for every language of the sign-up form. Press "Ok" to continue.', $filter('i18n')('OK'), 'switchToHtmlMode()', scope, {backdrop: 'static', keyboard: false});     
                    }
                } else if(scope.mailStyle.mail_logo_url){
                    FormsService.updateTemplatePreview($routeParams.id, newValue[1], newValue[0]).then(function (result) {   
                        result = $(result).click(function(event){
                            event.preventDefault();
                            console.log('disabled click inside iframe');
                        });
                        $(element).find('#templateEmailPreview').contents().find('html').html(result);
                    });
                }
            };

            var reactToChanges = _.debounce(reactFunction, 900);

            // listen to mailStyle and body changes
            scope.$watch('[mailStyle, body]', function (newValue, oldValue) {
                
                reactToChanges(newValue, oldValue);
        
            }, true);

        }
    }
});