sap.ui.define([
"sap/ui/core/format/DateFormat" 
	] , function (dateFormat) {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
			creationInfo: function(dDate, sFullName) {
				var oDateFormat = dateFormat.getDateTimeInstance({
					pattern: "dd/MM/yyyy HH:mm"
				});
				var sDate = oDateFormat.format(dDate);
				var lastName = sFullName ? sFullName.split(' ')[1] : sFullName;
				var nowDate = new Date();
				
				var seconds = Math.floor((nowDate - (dDate))/1000);
				var minutes = Math.floor(seconds/60);
				var hours = Math.floor(minutes/60);
				var days = Math.floor(hours/24);
				
				hours = hours-(days*24);
				minutes = minutes-(days*24*60)-(hours*60);
				seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);
				return `${this.getModel("i18n").getResourceBundle().getText("labelModifiedBy")} ${lastName} ` +
					`${this.getModel("i18n").getResourceBundle().getText("labelModifiedOn")} ${sDate}, ` + 
					`${this.getModel("i18n").getResourceBundle().getText("labelModified")} ` + 
					`${days}${this.getModel("i18n").getResourceBundle().getText("labelDay")}, ` +
					`${hours}${this.getModel("i18n").getResourceBundle().getText("labelHours")}, ` +
					`${minutes}${this.getModel("i18n").getResourceBundle().getText("labelMinutes")} ` + 
					`${this.getModel("i18n").getResourceBundle().getText("labelAgo")}`
			}

		};

	}
);