/*global location history */
sap.ui.define([
	"zjblessons/Market/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Dialog",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, History, Filter, FilterOperator, Dialog, MessageToast) {
	"use strict";

	return BaseController.extend("zjblessons.Market.controller.Worklist", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				userId: 'D1B1000032',
				buttonEnabled: false
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#Market-display"
			}, true);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty

			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		onPressSayHello: function(oEvent) {
			MessageToast.show("Say Hello!");

		},

		onPressCreate: function() {
			if (!this.oDialogCreate) {
				this.oDialogCreate = new Dialog({
					title: "Create new Material",
					type: "Message",
					contentWidth: "30em",
					content: [
						new sap.m.Label({
							text: "{i18n>worklistMaterialText}",
							lableFor: "MaterialTextCreate"
						}),
						new sap.m.Input("MaterialTextCreate", {
							width: "100%",
							maxLength: 30,
							liveChange: function(oEvent) {
								this.setCreateEnabled();
							}.bind(this)
						}),
						new sap.m.Label({
							text: "{i18n>worklistGroupID}",
							lableFor: "GroupIDCreate"
						}),
						new sap.m.Input("GroupIDCreate", {
							width: "100%",
							maxLength: 10,
							liveChange: function(oEvent) {
								this.setCreateEnabled();
							}.bind(this)
						}),
						new sap.m.Label({
							text: "{i18n>worklistSubGroupID}",
							lableFor: "SubGroupIDCreate"
						}),
						new sap.m.Input("SubGroupIDCreate", {
							width: "100%",
							maxLength: 10,
							liveChange: function(oEvent) {
								this.setCreateEnabled();
							}.bind(this)
						})
					],
					beginButton: new sap.m.Button({
						type: "Emphasized",
						text: "{i18n>worklistCreate}",
						enabled: "{dialog>/beginButtonEnabled}",
						press: function() {
							this._createMaterial();
							this.oDialogCreate.close();
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: "{i18n>worklistCancel}",
						press: function() {
							this.oDialogCreate.close();
							this.oDialogCreate.getContent()[1].setValue("");
							this.oDialogCreate.getContent()[3].setValue("");
							this.oDialogCreate.getContent()[5].setValue("");
						}.bind(this)
					})
				}).addStyleClass("sapUiSizeCompact");

				this.getView().addDependent(this.oDialogCreate);
			}
			this.oDialogCreate.setModel(new JSONModel({
				beginButtonEnabled: false
			}), "dialog");
			this.oDialogCreate.open();
		},

		setCreateEnabled: function() {
			var isEnabled = (
				this.oDialogCreate.getContent()[1].getValue() !== "" &&
				this.oDialogCreate.getContent()[3].getValue() !== "" &&
				this.oDialogCreate.getContent()[5].getValue() !== ""
			);
			this.oDialogCreate.getModel("dialog").setProperty("/beginButtonEnabled", isEnabled);
		},

		// setUpdateVisible: function() {
		// 	var Visible = this.getView().byId("btn1");
		// 	if (Visible.getVisible()) {
		// 		Visible.setVisible(false);
		// 	}
		// },

		onPressUpdate: function(oEvent) {
			if (!this.oDialogUpdate) {
				this.oDialogUpdate = new Dialog({
					title: "Update Material",
					type: "Message",
					contentWidth: "30em",
					content: [
						new sap.m.Label({
							text: "{i18n>worklistMaterialText}",
							lableFor: "MaterialTextUpdate"
						}),
						new sap.m.Input("MaterialTextUpdate", {
							width: "100%",
							maxLength: 30,
							value: "{MaterialText}"
						}),
						new sap.m.Label({
							text: "{i18n>worklistGroupID}",
							lableFor: "GroupIDUpdate"
						}),
						new sap.m.Input("GroupIDUpdate", {
							width: "100%",
							maxLength: 10,
							value: "{GroupID}"
						}),
						new sap.m.Label({
							text: "{i18n>worklistSubGroupID}",
							lableFor: "SubGroupIDUpdate"
						}),
						new sap.m.Input("SubGroupIDUpdate", {
							width: "100%",
							maxLength: 10,
							value: "{SubGroupID}"
						})
					],
					buttons: [new sap.m.Button({
							type: "Emphasized",
							text: "{i18n>worklistOk}",
							press: function() {
								// this._updateMaterial();
								this.oDialogUpdate.close();
							}.bind(this)
						}),
						new sap.m.Button({
							text: "{i18n>worklistReset}",
							press: function() {
								var oBindingContext = this.oDialogUpdate.getBindingContext();
								var aPaths = [oBindingContext.sPath];
								this.getModel().resetChanges(aPaths);
							}.bind(this)
						})
						// new sap.m.Button({
						// 	text: "{i18n>worklistCancel}",
						// 	press: function() {
						// 		this.getModel().resetChanges();
						// 		this.oDialogUpdate.close();
						// 		// this.oDialogUpdate.getContent()[1].setValue("");
						// 		// this.oDialogUpdate.getContent()[3].setValue("");
						// 		// this.oDialogUpdate.getContent()[5].setValue("");
						// 	}.bind(this)
						// })
					]

				}).addStyleClass("sapUiSizeCompact");

				this.getView().addDependent(this.oDialogUpdate);
			}
			this.oDialogUpdate.open();
			this.oDialogUpdate.setBindingContext(oEvent.getSource().getBindingContext());
		},

		_createMaterial: function() {
			var oEntry = {
				MaterialID: "",
				MaterialText: this.oDialogCreate.getContent()[1].getValue(),
				Language: "RU",
				GroupID: this.oDialogCreate.getContent()[3].getValue(),
				Version: "A",
				SubGroupID: this.oDialogCreate.getContent()[5].getValue()
			};
			this.getModel().create("/zjblessons_base_Materials", oEntry, {
				sucess: function(e) {
					MessageToast.show("New Material was created successfully");
				},
				error: function(e) {
					MessageToast.show("Error");
				}
			});
			this.oDialogCreate.getContent()[1].setValue("");
			this.oDialogCreate.getContent()[3].setValue("");
			this.oDialogCreate.getContent()[5].setValue("");

		},

		_updateMaterial: function() {
			var sPath = this.oDialogUpdate.getBindingContext().getPath();
			this.getModel().update(sPath, {
				MaterialText: this.oDialogUpdate.getContent()[1].getValue(),
				GroupID: this.oDialogUpdate.getContent()[3].getValue(),
				SubGroupID: this.oDialogUpdate.getContent()[5].getValue()
			}, {
				success: function(e) {
					MessageToast.show("Material was updated successfully");
				},
				error: function(e) {
					MessageToast.show("Error");
				}
			});
			this.oDialogUpdate.getContent()[1].setValue("");
			this.oDialogUpdate.getContent()[3].setValue("");
			this.oDialogUpdate.getContent()[5].setValue("");
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
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

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("MaterialText", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("MaterialID")
			});
		},

		onPressDelete: function(oEvent) {
			var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
			this.getModel().remove(sPath);
		},

		onPressRefresh: function() {
			this.byId('idSmartTableMaterials').rebindTable();
			// this.getModel().refresh();
		},

		onPressSubmitChanges: function() {
			this.getModel().submitChanges();
		},

		onPressResetChanges: function() {
			this.getModel().resetChanges();
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});