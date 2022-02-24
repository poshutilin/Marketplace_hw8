/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"zjblessons/Market/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"zjblessons/Market/test/integration/pages/Worklist",
	"zjblessons/Market/test/integration/pages/Object",
	"zjblessons/Market/test/integration/pages/NotFound",
	"zjblessons/Market/test/integration/pages/Browser",
	"zjblessons/Market/test/integration/pages/App"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "zjblessons.Market.view."
	});

	sap.ui.require([
		"zjblessons/Market/test/integration/WorklistJourney",
		"zjblessons/Market/test/integration/ObjectJourney",
		"zjblessons/Market/test/integration/NavigationJourney",
		"zjblessons/Market/test/integration/NotFoundJourney",
		"zjblessons/Market/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});