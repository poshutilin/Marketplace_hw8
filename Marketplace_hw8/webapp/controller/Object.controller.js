/*global location*/
sap.ui.define([
	"zjblessons/Market/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"zjblessons/Market/model/formatter",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(
	BaseController,
	JSONModel,
	History,
	formatter,
	MessageToast,
	MessageBox
) {
	"use strict";

	return BaseController.extend("zjblessons.Market.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0,
					editMode: false,
					newMaterial: null
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.setJsonModel(sObjectId);
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("zjblessons_base_Materials", {
					MaterialID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		setJsonModel: function(sObjectId) {
			this.getModel().read("/zjblessons_base_Materials('" + sObjectId + "')", {
				success: function(oData) {
					this.setModel(new JSONModel({}), "json");
					this.getModel("json").setData(oData);
					this.getModel("objectView").setProperty("/newMaterial", Object.assign({}, oData));
				}.bind(this),
				error: function() {
					MessageToast.show("Error");
				}
			});
		},

		onPressEdit: function() {
			this.getModel("objectView").setProperty("/editMode", true);
		},

		onPressSave: function() {
			if(this.byId("inputMaterialText").getValue() === "") {
				this.getModel("objectView").setProperty("MaterialDescription", "");
			}
			this._submitChanges();
			this.getModel("objectView").setProperty("/editMode", false);
			},
			
		_submitChanges: function() {
			this.getModel().submitChanges({
				success: function(oData) {
					MessageToast.show("Saved");
				}.bind(this),
				error: function() {
					MessageToast.show("Error");
				}.bind(this)
			});
		},

		onPressReset: function() {
			this.getModel().resetChanges();
		},
		
		onPressRefresh: function() {
			// this.byId('sMaterials').rebindTable();
			this.getModel().refresh();
		},
		
		onGroupChange: function(oEvent) {
			var oSmartField = oEvent.getSource();
			var sSelectedValue = oSmartField.getValue();
			MessageToast.show(this.getModel("i18n").getResourceBundle().getText("tSelected") + " " + sSelectedValue);
		},
		
		onPressRegionChange: function(oEvent) {
			var sRegionID = oEvent.getParameter("selectedItem").getKey(),
				aFilter = new sap.ui.model.Filter("RegionID", sap.ui.model.FilterOperator.EQ, sRegionID);
			this.byId("groupSelectPlant").getBinding("items").filter(aFilter);
		},

		onPressSubmitChanges: function() {
			this.getModel().submitChanges();
		},
		
		onEditToggled: function(oEvent) {
			var btnEditable = oEvent.getParameter("editable");
			if (!btnEditable) {
				MessageBox.confirm("Save changes?", {
					actions: ["Save", MessageBox.Action.CANCEL],
					emphasizedAction: "Save",
					onClose: function (oAction) { 
						if (oAction === "Save") {
							this._submitChanges();
						}
					}.bind(this)
				});
			}
		},
		
		onPressBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("overview", true);
			}
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.MaterialID,
				sObjectName = oObject.MaterialText;

			oViewModel.setProperty("/busy", false);
			// Add the object page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
				icon: "sap-icon://enter-more",
				intent: "#Market-display&/zjblessons_base_Materials/" + sObjectId
			});

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		}

	});

});