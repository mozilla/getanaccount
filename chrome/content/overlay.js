/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Account Provisioner code.
 *
 * The Initial Developer of the Original Code is
 * The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Blake Winton <bwinton@mozillamessaging.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

let msgComposeService = Components.classes["@mozilla.org/messengercompose;1"]
                          .getService()
                          .QueryInterface(Components.interfaces.nsIMsgComposeService);

function NewOnLoadMessenger() {
  AutoConfigWizard = function newAutoConfigWizard(okCallback) {
    NewMailAccountProvisioner(msgWindow, {okCallback: okCallback});
  }
  OnLoadMessenger();
}

function NewComposeMessage() {
  let fields = Components.classes["@mozilla.org/messengercompose/composefields;1"]
                 .createInstance(Components.interfaces.nsIMsgCompFields);
  let params = Components.classes["@mozilla.org/messengercompose/composeparams;1"]
                 .createInstance(Components.interfaces.nsIMsgComposeParams);
  params.composeFields = fields;
  params.type = Components.interfaces.nsIMsgCompType.New;
  params.format = Components.interfaces.nsIMsgCompFormat.Default;
  msgComposeService.OpenComposeWindowWithParams(null, params);
}

function NewMailAccountProvisioner(aMsgWindow, args) {
  if (!args)
    args = {};
  if (!aMsgWindow)
    aMsgWindow = Components.classes["@mozilla.org/messenger/services/session;1"]
                   .getService(Components.interfaces.nsIMsgMailSession)
                   .topmostMsgWindow;
  args.msgWindow = aMsgWindow;

  if (!args.NewMailAccount)
    args.NewMailAccount = NewMailAccount;

  if (!args.NewComposeMessage)
    args.NewComposeMessage = NewComposeMessage;

  if (!args.openAddonsMgr)
    args.openAddonsMgr = openAddonsMgr;

  if (!args.okCallback)
    args.okCallback = null;

  window.openDialog(
    "chrome://getanaccount/content/accountProvisioner.html",
    "AccountSetup",
    "chrome,titlebar,centerscreen,width=640,height=480",
    args);
}

(function() {
  var newMailAccountOverlay = {
    onLoad: function(e) {
      if (typeof AddMailAccount === "function") {
        // Replace the AddMailAccount global function with our own
        AddMailAccount = function() { NewMailAccountProvisioner(); }
      }
    }
  };

  window.addEventListener("load", function(e) {
    newMailAccountOverlay.onLoad(e);
  }, false);

}());
