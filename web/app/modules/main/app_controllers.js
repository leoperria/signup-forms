'use strict';

App.controller('MainCtrl', function ($scope, BASE_PATH, $filter, $route, $http, $location, $rootScope, PopupService, logger, WorkerService, debugUtils, $templateCache, ToastService, SegmentsService, SpinnerService, PopoverChannel, AuthorizationService) {

    $rootScope.BASE_PATH=BASE_PATH;

    logger.info('MainCtrl', 'init()');

    $scope.worker_style = null;
    $rootScope.loading = false;
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        logger.log('MainCtrl', '$routeChangeStart: ' + ( typeof current === 'undefined' || typeof current.$$route === 'undefined' ? 'NULL' : current.$$route.controller  ) + ' -> ' + ( typeof next === 'undefined' || typeof next.$$route === 'undefined' ? 'NULL' : next.$$route.controller));
    });
    $rootScope.$on('$routeChangeSuccess', function () {
        logger.log('MainCtrl', '$routeChangeSuccess: ' + $location.path());
    });

    $rootScope.showError = function ($message) {
        PopupService.alert($filter('i18n')('sorry'), $message, "Close", "", {}, null);
    };

    $scope.navClass = function (page) {
        var currentRoute = $location.path().split('/')[1];
        return (page == currentRoute || page == currentRoute+"s" ) ? 'active' : '';
    };

    $scope.$watch(function () {
        return WorkerService.thereIsPendingJob;
    }, function (thereIsPendingJob) {
        $scope.thereIsPendingJob = thereIsPendingJob;
    });

    $scope.$watch(function () {
        return WorkerService.workerStyle;
    }, function (workerStyle) {
        $scope.worker_style = workerStyle;
    });

    $scope.$watch(function () {
        return WorkerService.currentjob;
    }, function (currentjob) {
        $scope.currentJob = currentjob;
    });

    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        SpinnerService.on();
    });
    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        SpinnerService.off();
    });

    $scope.closePopovers = function () {
        PopoverChannel.closeAll();
    };

    $scope.closePopup = function () {
        PopupService.close();
    };

    $scope.disabledVisibility = true;
    $scope.toggleDisabledVisibilty = function () {
        $scope.disabledVisibility = !$scope.disabledVisibility;
        debugUtils.setDisabledElementConfig($scope.disabledVisibility);
    };
    $scope.toggleDisabledVisibilty(); //TODO: temporary fix

    $scope.goToSettingsPage = function () {
        $location.search('scrollTo','sender_info').path('settings');
    };

    $scope.goTo = function ( path ) {
      $location.path( path );
    };

});


App.controller('MainPageCtrl', function ($scope, ApplicationMeta, PoliciesService, PopupService, $filter, AuthorizationService) {

    ApplicationMeta.query().$promise.then(function(data){
		//FIX THESE - They are blocking the debug info - I disabled them temp. Nadi Hassan
		
        //$scope.application_revision=data.gitinfo.hash;
        //$scope.application_lastchanged=data.gitinfo.committer_date;


        $scope.appmode = {
            mode : data.mode,
            debug : data.debug
        };

        console.log("application_revision="+$scope.application_revision);
        console.log("application_lastchanged"+$scope.application_lastchanged);

    });

    AuthorizationService.getUsername().then(function (result) {
        $scope.username = result.username;
        $scope.canspam = {
            status : parseInt(result.canspamstatus)
        };
        console.warn("____ here");
        PoliciesService.getAccountPolicy().then(function(data){
            $scope.accountPolicy = data;
            PoliciesService.accountPolicy = data;
            if($scope.canspam.status==0 && data.allow_sending_without_can_spam_tags==false){
                PopupService.confirm($filter('i18n')('Welcome!'), $filter('i18n')('fill_sender_info_message'), $filter('i18n')('yes'), 'goToSettingsPage()', $filter('i18n')('cancel'), "closePopup()", $scope, []);
            }
        });
    });

});

