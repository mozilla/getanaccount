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
 * The Original Code is Account Provisioner Code.
 *
 * The Initial Developer of the Original Code is
 * The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Blake Winton <bwinton@mozillamessaging.com>
 * Bryan Clark <clarkbw@mozillamessaging.com>
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

var clickableButtons = ["button.create", "button.check", "button.submit"];

/**
 * Get the localstorage for this page in a way that works in chrome.
 *
 * Cribbed from
 *   mozilla/dom/tests/mochitest/localstorage/test_localStorageFromChrome.xhtml
 *
 * @param {String} page The page to get the localstorage for.
 * @return {nsIDOMStorage} The localstorage for this page.
 */
function getLocalStorage(page) {
  var url = "http://example.com/" + page;
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
  var ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"]
    .getService(Components.interfaces.nsIScriptSecurityManager);
  var dsm = Components.classes["@mozilla.org/dom/storagemanager;1"]
    .getService(Components.interfaces.nsIDOMStorageManager);

  var uri = ios.newURI(url, "", null);
  var principal = ssm.getCodebasePrincipal(uri);
  return dsm.getLocalStorageForPrincipal(principal);
}

function saveState() {
  var username = $("#username").val();
  var domain = $("#provider").find(":selected").attr("domain");

  storage.setItem("username", username);
  storage.setItem("domain", domain);
}

$(function() {
  // Snarf the things I need out of the window arguments.
  let NewMailAccount = window.arguments[0].NewMailAccount;
  let msgWindow = window.arguments[0].msgWindow;
  window.storage = getLocalStorage("accountProvisioner");

  var prefs = Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefBranch);
  var suggestFromName = prefs.getCharPref("extensions.accountprovisioner.suggestFromName");
  var checkAddress = prefs.getCharPref("extensions.accountprovisioner.checkAddress");
  var provision = prefs.getCharPref("extensions.accountprovisioner.provision");

  let username = storage.getItem("username") || $(".username").text();
  let domain = storage.getItem("domain") || $(".domain").text();
  $("#username").val(username);
  $("#provider").find("[domain=" + domain + "]").attr("selected", "selected");
  $("#provider").change();
  saveState();


  $("#provider").change(function() {
    var domain = $(this).find(":selected").attr("domain");
    $("#notifications > div").hide();
    $("#notifications").hide();
    $(".check").removeClass('clicked');
    $(".domain").text(domain);
    saveState();
  }).change();

  $("body").keyup(function(e) {
    if (e.keyCode == '13') {
      // Handle the return key.
      e.preventDefault();
      for (let i in clickableButtons) {
        if ($(clickableButtons[i]).is(':visible')) {
          $(clickableButtons[i]).click();
          break;
        }
      }
    }
    else if (e.keyCode == '87' && e.ctrlKey && !e.altKey) {
      // Handle Ctrl-W.
      window.close();
    }
  }).trigger("keyup");

  $("#name").change(function(e) {
    var name = $("#name").val().split(" ");
    var firstname = name[0];
    var lastname = name.slice(1).join(" ");
    var handler = suggestFromName + "?FirstName=" + firstname + "&LastName=" + lastname;
    $.getJSON(handler, function(data) {
      let alternates = $("#alternates");
      alternates.html("");
      if (data.succeeded) {
        alternates.append("<option address='' selected='true'>No, thanks!</option>");
        for each (let [, address] in Iterator(data.addresses))
          alternates.append("<option address='" + address + "'>" + address + "</option>");
        $("#notifications .personals").show();
      }
      else {
        // Figure out what to do if it failed.
        $("#notifications .personals").hide();
      }
    });
  });

  $("#username").keyup(function(e) {
    if (e.keyCode == '13')
      return;
    $("#notifications > div").hide();
    $("#notifications").hide();
    $(".check").removeClass('clicked');
    $(".username").text($(this).val());
    saveState();
  }).trigger('keyup');

  $("button.create").click(function() {
    saveState();
    $("#window").hide();
    $("#new_account").fadeIn(3 * 1000);
  });

  $("button.check").click(function() {
    saveState();
    $("#notifications").show();
    var domain = $("#provider").find(":selected").attr("domain");
    var username = $("#username").val();
    var handler = checkAddress + "?domain=" + domain + "&username=" + username;
    $.getJSON(handler, function(data) {
      if (data.succeeded) {
        $("#notifications .success").fadeIn();
      }
      else {
        $("#notifications .options").html("");
        for each (let [, address] in Iterator(data.addresses))
          for each (let [, alt] in Iterator(address.alternates))
            $("#notifications .options").append(
              "<li username='" + alt + "' domain='" + address.domain +
              "'>" + alt + "@" + address.domain + "</li>");
        $("#notifications .error").fadeIn();
      }
    });
  });

  $(".options").delegate("li", "click", function() {
    $("#notifications > div").hide();
    $("#notifications").hide();
    $("#username").val($(this).attr("username")).trigger('keyup');
    $("#provider").find("[domain="+$(this).attr("domain")+"]")
                  .attr("selected", "selected");
    $("#provider").change();
    $("#username").focus();
    $("button.create").effect('highlight', {}, 'slow');
    saveState();
  })

  $("button.submit").click(function() {
    saveState();
    var domain = $("#provider").find(":selected").attr("domain");
    var username = $("#username").val();
    var inputs = $("#new_account :input").not("[readonly]").not("button");
    var handler = provision + "?domain=" + domain + "&username=" + username;
    $.post(handler, inputs, function(data) {
      if (data.succeeded) {
        // Create the account using data.config!
        let config = readFromXML(new XML(data.config));
        let realname = $("#FirstName").val() + " " + $("#LastName").val();
        let email = username + "@" + domain;
        let password = $("#Passwd").val();
        replaceVariables(config, realname, email, password);
        createAccountInBackend(config);
        window.close();
      }
      else {
        for (let i in data.errors) {
          // Populate the errors.
          $("#new_account #"+i)
            .next(".error").text(data.errors[i]);
        }
      }
    }, "json");
  });

  $("button.existing").click(function() {
    saveState();
    NewMailAccount(msgWindow, undefined, NewMailAccount);
    window.close();
  });

  $("#name").focus().select();
  $("#existing").fadeIn(3 * 1000);
});
