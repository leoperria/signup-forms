'use strict';

// STEP 2 ---------------------------------------------------------------------------------------------------------------------------
App.controller('SignupFormsStep2Ctrl', function ($scope, $rootScope, logger, $filter, $templateCache, PopoverChannel) {

    var init = function () {

        $scope.typeIconMapping = {
            "HEADER": "fa-font",
            "FIELD": "fa-square-o",
            "BUTTON": "fa-square"
        };

        // Build element templates list
        $scope.elementTemplates = [
            {
                "type": "HEADER",
                "field_id": null,
                "required_field": null,
                "font_id": "15",
                "font_size": 24,
                "label": "Header text",
                "phrase": "Header text",
                "forceDraggable": true
            }
        ];

        // Adds predefined fields
        _.each($scope.predefinedFields, function (pf) {
            $scope.elementTemplates.push({
                "type": "FIELD",
                "field_id": pf.id,
                "required_field": pf.mandatory,
                "label": $filter('i18n')(pf.name) + " " + $filter('i18n')("field"),
                "phrase": $filter('i18n')(pf.name)
            });

        });

        // Adds Custom fields
        _.each($scope.customFieldsList, function (cf) {
            $scope.elementTemplates.push({
                "type": "FIELD",
                "field_id": cf.id,
                "required_field": null,
                "label": cf.name + " field",
                "phrase": cf.name
            });
        });

        //Add final elements
        $scope.elementTemplates.push({
            "type": "HEADER",
            "forceDraggable": true,
            "field_id": null,
            "font_id": '1',
            "font_size": '13',
            "required_field": null,
            "label": "Footer text",
            "phrase": "This a footer"
        });

        $scope.elementTemplates.push({
            "type": "HEADER",
            "field_id": null,
            "font_id": '1',
            "font_size": '13',
            "required_field": null,
            "forceDraggable": true,
            "label": "Privacy disclaimer",
            "phrase": "We respect your privacy"
        });

        $scope.elementTemplates.push({
            "type": "BUTTON",
            "forceDraggable": false,
            "field_id": null,
            "required_field": null,
            "label": "Signup button",
            "phrase": "Signup"
        });

    };

    //################### TEMPLATES

    $scope.form_template_category_id = null;
    $scope.available_form_templates = [];
    $scope.form_template_id = null;

    if ($scope.form_template_categories.length > 0) {
        $scope.form_template_category_id = $scope.form_template_categories[0].id;


    }

    $scope.$watch('form_template_category_id', function (newVal) {
        if (newVal == null) {
            return;
        }
        $scope.available_form_templates = _.reject($scope.form_templates, function (e) {
            return e.category_id != $scope.form_template_category_id;
        });

    });

    $scope.nextTemplate = function () {

    };

    $scope.prevTemplate = function () {

    };

    //################### FORM EDITOR

    /**
     * Update draggable property of each element template according
     * to current form elements and forcing rule
     */
    $scope.$watch("formModel.form_elements", function () {
        _.each($scope.elementTemplates, function (et, index, list) {
            if (et.hasOwnProperty('forceDraggable')) {
                et.draggable = et.forceDraggable;
            } else {
                var matching = _.where($scope.formModel.form_elements, {
                    type: et.type,
                    field_id: et.field_id
                });
                et.draggable = matching.length == 0;
            }
        });
    }, true);

    $scope.removeElement = function (index) {
        logger.log("SignupFormsStep2Ctrl", "Remove element: ", index);
        $scope.formModel.form_elements.splice(index, 1);
    };

    $scope.isDeleteVisible = function (element) {
        return !(element.type == "BUTTON" || element.field_id == -1);
    };

    $scope.isRequiredFieldCheckboxVisible = function (element) {
        var f = $scope.getFieldById(element.field_id);

        if (f.data_type == "boolean") {
            return false;
        }

        if (parseInt(element.field_id) > 0) {
            // Custom field (required checkbox always visible)
            return true;
        } else {
            // Predefined field
            return f ? !parseBool(f.mandatory) : true;
        }
    };

    $scope.getFieldById = function (id) {
        if (parseInt(id) > 0) {
            return _.findWhere($scope.customFieldsList, {
                id: id
            });
        } else {
            return _.findWhere($scope.predefinedFields, {
                id: id
            });
        }
    };

    $scope.getDefaultCountry = function () {
        return $scope.countries[0].code;
    };

    $scope.addElement = function (e, ui) {
        $scope.$apply(function () {
            PopoverChannel.closeAll();
            var dstIndex = parseInt(angular.element(e.target).data("key"));
            var srcIndex = parseInt(ui.draggable.data("key"));
            logger.log("SignupFormsStep2Ctrl", "Add element:" + srcIndex + " -> " + dstIndex);
            var et = $scope.elementTemplates[srcIndex];
            var el = {
                "type": et.type,
                "field_id": et.field_id,
                "required_field": et.required_field,
                "font_id": et.font_id || null,
                "font_size": et.font_size || null,
                "input_font_id": et.input_font_id || null,
                "input_font_size": et.input_font_size || null,
                "form_element_languages": []
            };
            _.each($scope.formModel.form_languages, function (lang) {
                el.form_element_languages.push({
                    "language_id": lang.language_id,
                    "phrase": et.phrase
                });
            });
            $scope.formModel.form_elements.splice(dstIndex, 0, el);
        });
    };

    var inverse = function (hex) {
        if (hex.length != 7 || hex.indexOf('#') != 0) {
            return null;
        }
        var r = (255 - parseInt(hex.substring(1, 3), 16)).toString(16);
        var g = (255 - parseInt(hex.substring(3, 5), 16)).toString(16);
        var b = (255 - parseInt(hex.substring(5, 7), 16)).toString(16);
        return "#" + pad(r) + pad(g) + pad(b);
    };

    var pad = function (num) {
        if (num.length < 2) {
            return "0" + num;
        } else {
            return num;
        }
    };

    $scope.getDividerColor = function () {
        return {
            "background-color": inverse($scope.formModel.form_bg_style1 || "#ffffff")
        };
    };

    $scope.optSortableOptions = {
        axis: 'y',
        handle: '.form-drag-handle',
        containment: '.draggable-zone',
        stop: function () {
            $scope.$apply(function () {
                logger.log('CustomFieldsCtrl', 'New sorting persisted to backend');
                PopoverChannel.closeAll();
            });
        }
    };

    $scope.draggableOpt = {
        helper: 'clone',
        revert: 'valid',
        revertDuration: 200,
        opacity: 1,
        cursorAt: {
            right: 40
        }
    };

    $scope.droppableOpt = {
        accept: '.draggable',
        tolerance: 'pointer',
        hoverClass: 'drop-hover'
    };


    //################### FORM STYLING

    $scope.getFontById = function (id) {
        var f = {};
        if(isNaN(parseInt(id))){
            f = _.findWhere($scope.fonts, {
                name: id
            });
        } else {
            f = _.findWhere($scope.fonts, {
                id: id
            });   
        }
       
        return f.family || '';
    };

    $scope.renderFormStyle = function () {
        var gradient = '';
        switch (BrowserDetect.browser) {
            case 'Explorer':
                gradient = '-ms-linear-gradient(top, ' + $scope.formModel.form_bg_style + ' 0%, ' + $scope.formModel.form_bg_style1 + ' 40%, ' + $scope.formModel.form_bg_style1 + ' 100%)';
                break;
            case 'Chrome':
                gradient = '-webkit-gradient(linear, left top, left bottom, color-stop(0%, ' + $scope.formModel.form_bg_style + '), color-stop(40%, ' + $scope.formModel.form_bg_style1 + '), color-stop(100%, ' + $scope.formModel.form_bg_style1 + '))';
                break;
            case 'Firefox':
                gradient = '-moz-linear-gradient(top, ' + $scope.formModel.form_bg_style + ' 0%, ' + $scope.formModel.form_bg_style1 + ' 40%, ' + $scope.formModel.form_bg_style1 + ' 100%)';
                break;
        }
        return {
            'font-family': 'Arial, Helvetica, sans-serif',
            'background-color': $scope.formModel.form_bg_style,
            'background-image': gradient,
            'filter': "progid:DXImageTransform.Microsoft.gradient(startColorstr='" + $scope.formModel.form_bg_style + "', endColorstr='" + $scope.formModel.form_bg_style1 + "', GradientType=0)"
        };
    };

    $scope.renderHeaderStyle = function (element) {
        return {
            'color': $scope.formModel.form_fg_style || '#FFF',
            'font-family': $scope.getFontById(element.font_id || $scope.formModel.text_font_id || 'Arial'),
            'font-size': (element.font_size || $scope.formModel.text_font_size || '12') + 'px'
        };
    };

    $scope.renderFieldLabelStyle = function (element) {
        return {
            'color': $scope.formModel.form_fg_style || '#FFF',
            'font-family': $scope.getFontById(element.font_id || $scope.formModel.text_font_id || 'Arial'),
            'font-size': (element.font_size || $scope.formModel.text_font_size || '12') + 'px'
        };
    };

    $scope.renderFieldInputStyle = function (element) {
        return {
            'font-family': $scope.getFontById(element.font_id || $scope.formModel.input_font_id || 'Arial'),
            'font-size': (element.font_size || $scope.formModel.input_font_size || '12') + 'px'
        };
    };

    $scope.renderButtonStyle = function (element) {
        return {
            'background-color': element.bg_style || '#FFF', //'#DE493D'
            'color': element.fg_style || $scope.formModel.form_fg_style,
            'border-color': element.border_style || '#FFF',
            'font-family': $scope.getFontById(element.font_id || $scope.formModel.text_font_id || 'Arial'),
            'font-size:': (element.font_size || $scope.formModel.text_font_size || '12') + 'px'
        };
    };

    init();

});


App.controller('RowCtrl', function ($scope, logger, $templateCache, PopoverChannel) {

    $scope.popoverVisible = false;

    $scope.openPopover = function ($event) {
        $scope.popoverVisible = true;
        $event.stopPropagation();
        PopoverChannel.signalPopoverShow($scope.ndx);
    };

    $scope.closePopover = function () {
        $scope.popoverVisible = false;
        PopoverChannel.signalPopoverShow($scope.ndx);
    };

    $scope.handleKeyPress = function ($event) {
        if ($event.keyCode == 13) {
            $scope.closePopover();
        }
    };

    PopoverChannel.onPopoverShow($scope, function (id) {
        //  logger.log('PopoverCtrl', 'onPopoverShow  ' + id);
        if (id != $scope.ndx) {
            $scope.popoverVisible = false;
        }
    });

    PopoverChannel.onCloseAll($scope, function () {
        //logger.log('PopoverCtrl', 'onCloseAll');
        $scope.popoverVisible = false;
    });

    $scope.popoverOptions = {
        content: $templateCache.get('fieldEditorPopover.html'),
        placement: 'bottom',
        animation: false,
        container: 'body',
        trigger: 'manual'
    };

});