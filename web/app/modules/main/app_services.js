'use strict';


App.factory("FieldTypes",
    function (BASE_PATH,$resource) {
        return $resource(BASE_PATH+"/meta/types", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
);

App.factory("Fonts",
    function (BASE_PATH,$resource) {
        return $resource(BASE_PATH+"/meta/fonts", {}, {
            query: {method: 'GET', isArray: true, cache: true}
    });
    }
);

App.factory("Languages",
    function (BASE_PATH,$resource) {
        return $resource(BASE_PATH+"/meta/languages", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
);

App.factory("Countries",
    function (BASE_PATH,$resource) {
        return $resource(BASE_PATH+"/meta/countries", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
);

App.factory("USStates",
    function (BASE_PATH,$resource) {
        return $resource(BASE_PATH+"/meta/states", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
);

App.factory("Timezones",  
   function(BASE_PATH, $resource){
       return $resource(BASE_PATH + "/meta/timezones", {}, {
            query: { method: "GET", isArray: true, cache: true}
       });
   }
);

App.factory("ApplicationMeta",
    function(BASE_PATH, $resource){
        return $resource(BASE_PATH + "/meta/application", {}, {
            query: { method: "GET", isArray: false, cache: true}
        });
    }
);

App.factory("PoliciesService", function(BASE_PATH, $http, logger, $filter){
    return {
        accountPolicy: null,
        missingTags:{},
        getPolicies:  function () {
            var self = this;
            return $http({
                method: "GET",
                url: BASE_PATH+"/meta/policies"
            });
        },
        getAccount: function(){
            var self = this;
            return $http({
                method: "GET",
                url: BASE_PATH+"/accounts/current"
            });
        },
        getAccountPolicy: function(){
            var self = this;
            return self.getAccount().then(function(accountResponse){
                console.warn("accountResponse");
                console.log(accountResponse);
                return $http({
                    method: "GET",
                    url: BASE_PATH+"/meta/policies/" + accountResponse.data.mode
                }).then(function(policyResponse){
                    logger.log('PoliciesService', 'getAccountPolicy response: ' + JSON.stringify(policyResponse) );
                    return  policyResponse.data[accountResponse.data.mode];
                });
            });
        },
        isset: function(variable){
            return (typeof variable != 'undefined');
        },
        isValid: function(esit){
            for(var i = 0; i < esit.length ; i++)
                if(!esit[i].valid) return false;
            return true;
        },
        getErrorCase: function(esit){
            var errorCase = "";
            angular.forEach(esit, function(error){if(error.type) errorCase += error.type;});
            return errorCase;
        },
        //validation entry point
        validateNewsletter: function(newsletterModel){
            logger.log('PoliciesService','validateNewsletter()');
            var esit =  [this.validateHtmlBodyNewsletter(newsletterModel), this.validateTextBodyNewsletter(newsletterModel)];
            return (this.isValid(esit))?{valid:true}: {valid:false,result:esit,errorCase: this.getErrorCase(esit)};
        },
        validateHtmlBodyNewsletter: function(newsletterModel){
            logger.log('PoliciesService','validateHtmlBodyNewsletter()');
            var self = this
            ,   result = null;  
            if(!self.accountPolicy) throw new Error('user policy not setted in PoliciesService');               
            if( self.isset(self.accountPolicy.warn_before_sending_without_can_spam_tags)  && 
                self.accountPolicy.warn_before_sending_without_can_spam_tags && 
                !(result = self.warn_before_sending_without_can_spam_tagsValidation(newsletterModel.html_body,'html')).valid) 
                    return result;

            return {valid: true};
        },
        validateTextBodyNewsletter: function(newsletterModel){
            logger.log('PoliciesService','validateTextBodyNewsletter()');
            var self = this
            ,   result = null;
            if(!self.accountPolicy) throw new Error('user policy not setted in PoliciesService');               
            if( self.isset(self.accountPolicy.warn_before_sending_without_can_spam_tags)  && 
                self.accountPolicy.warn_before_sending_without_can_spam_tags && 
                !(result = self.warn_before_sending_without_can_spam_tagsValidation(newsletterModel.text_body,'text')).valid) 
                    return result;

            return {valid: true};   
        },
        warn_before_sending_without_can_spam_tagsValidation: function(body,type){
            logger.log('PoliciesService','warn_before_sending_without_can_spam_tagsValidation()');
            var camSpamActTags = ["[[unsubscribe_link]]","[[account:business]]","[[account:address_1]]","[[account:city]]","[[account:postal_code]]","[[account:country]]"]
            ,   missingTags = []
            ,   self = this;

            if(!body)
                missingTags = camSpamActTags;
            
            // look for missing tags:
            for (var c = 0; c < camSpamActTags.length && body; c++) 
                if(body.indexOf(camSpamActTags[c]) == -1) 
                    missingTags.push(camSpamActTags[c]);
            self.missingTags[type] = missingTags;

            return (missingTags.length)?{valid:false,type:type, missingTags: missingTags, failedCheck: 'warn_before_sending_without_can_spam_tags' }:{valid:true};  
        },
        addAutomaticallyRequiredTagsInHtmlBody: function(newsletterModel){
            logger.log('PoliciesService','addAutomaticallyRequiredTagsInHtmlBody()');
            var bodyIndex = -1
            ,   self = this
            ,   isBodyTagPreset = ( newsletterModel.html_body.search(/<body[^>]*>/im)!= -1 && (bodyIndex = newsletterModel.html_body.search(/<\/body[^>]*>/im))!= -1) ;
            if(!newsletterModel.html_body)
                newsletterModel.html_body = "";
            angular.forEach(self.missingTags['html'], function(tag){
                var completeTag = (tag=='[[unsubscribe_link]]')?'<a href=\"[[unsubscribe_link]]\">'+$filter('i18n')('unsubscribe') + '</a>':'<p>'+tag+'</p>';
                newsletterModel.html_body = (isBodyTagPreset)?newsletterModel.html_body.substring(0, bodyIndex) + completeTag + newsletterModel.html_body.substring(bodyIndex,newsletterModel.html_body.length):newsletterModel.html_body.concat(completeTag);                  
            });     
            // --- //      
            tinymce.elm.val(newsletterModel.html_body);

                    
            tinymce.ed.setContent(newsletterModel.html_body);   
            tinymce.updateView();           
            // --- //
        },
        addAutomaticallyRequiredTagsInTextBody: function(newsletterModel){
            logger.log('PoliciesService','addAutomaticallyRequiredTagsInTextBody()');
            var bodyIndex = -1
            ,   self = this;
            if(!newsletterModel.text_body)
                newsletterModel.text_body = "";
            angular.forEach(self.missingTags['text'], function(tag){
                var completeTag = (tag=='[[unsubscribe_link]]')?$filter('i18n')('unsubscribe') +': [[unsubscribe_link]]':tag;
                newsletterModel.text_body = newsletterModel.text_body.concat(completeTag);  
            });                                         
        }
    }
});