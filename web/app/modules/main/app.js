
'use strict';

var App = angular.module('App', ['ngRoute', 'ngResource', 'ngCookies', 'ui.sortable', '$strap.directives', 'ngDragDrop', 'ui.bootstrap', 'colorpicker.module', 'kendo.directives', 'hljs', 'ui.tinymce', 'ui.ace','gridster']);



App.value('loggerConfig', {
    minLevel: 'log',
    enableAll: false,
    enabledChannels: {
        MainCtrl: false,
        AuthorizationCtrl: false,
        grid: false,
        grid2: false,
        GridDatasourceBase: false, 
        authorizationHttpInterceptor: false,
        instanceinHttpInterceptor: true,
        ImportContactsCtrl: false,
        ImportContactsService: true,
        fileupload: false,
        CampaignsEditCtrl: true,
        ContactListsService: false,
        debugUtils: false,
        CampaignsCtrl: false,
        CampaignService: true,
        CustomFieldsCtrl: false,
        SegmentsNewAndEditCtrl: false,
        SignupFormMainCtrl: false,
        SignupFormsStep2Ctrl: false,
        PopoverCtrl: false,
        SignupFormsCtrl: false,
        GlobalBlacklistCtrl : false,
        ChooseCampaignTypeCtrl: false,
        PoliciesService: true,
        CampaignEditorService: false,
        AutorespondersCtrl: false,
        PortletsGridService:false,
        PortletsGrid:false
    }
});

App.value('BASE_PATH',"../../apps/api/index.php/v1");
