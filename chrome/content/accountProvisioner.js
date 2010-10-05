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

var clickableButtons = ["button.create", "button.search", "button.submit"];

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
  var firstname = $("#FirstName").val();
  var lastname = $("#LastName").val();
  var username = $("#username").val();
  var domain = $("#provider").find(":selected").attr("domain");

  storage.setItem("firstname", firstname);
  storage.setItem("lastname", lastname);
  storage.setItem("username", username);
  storage.setItem("domain", domain);
}

$(function() {
  // Snarf the things I need out of the window arguments.
  let NewMailAccount = window.arguments[0].NewMailAccount;
  let msgWindow = window.arguments[0].msgWindow;
  window.storage = getLocalStorage("accountProvisioner");

  let prefs = Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefBranch);
  let suggestFromName = prefs.getCharPref("extensions.accountprovisioner.suggestFromName");
  let checkAddress = prefs.getCharPref("extensions.accountprovisioner.checkAddress");
  let provision = prefs.getCharPref("extensions.accountprovisioner.provision");

  let pref_name = "geo.wifi.protocol";
  if (!prefs.prefHasUserValue(pref_name))
    prefs.setIntPref(pref_name, 0);
  pref_name = "geo.wifi.uri";
  if (!prefs.prefHasUserValue(pref_name))
    prefs.setCharPref(pref_name, "https://www.google.com/loc/json");

  var geolocation = Cc["@mozilla.org/geolocation;1"]
                      .getService(Ci.nsIDOMGeoGeolocation);
  geolocation.getCurrentPosition(
    function ht_gotPosition(position) {
      // If the user hasn't picked something already,
      // choose the country they're in.
      if (!$("#loc option:selected").val())
        $("#loc").val(position.address.countryCode);
    },
    function ht_gotError(e) {
      log("GeoError: " + e.code + ": " + e.message);
    });

  let firstname = storage.getItem("firstname") || $("#FirstName").text();
  let lastname = storage.getItem("lastname") || $("#LastName").text();
  let username = storage.getItem("username");
  let domain = storage.getItem("domain");
  $("#FirstName").val(firstname);
  $("#LastName").val(lastname);
  //$("#username").val(username);
  //$("#provider").find("[domain=" + domain + "]").attr("selected", "selected");
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
    if (e.keyCode == '87' && ((e.ctrlKey && !e.altKey) || e.metaKey)) {
      // Handle Ctrl-W.
      window.close();
    }
  }).trigger("keyup");

  $(".search").click(function() {
    saveState();
    var firstname = $("#FirstName").val();
    var lastname = $("#LastName").val();
    if (firstname.length <= 0) {
      $("#FirstName").select().focus();
      return;
    }
    if (lastname.length <= 0) {
      $("#LastName").select().focus();
      return;
    }
    $.getJSON(suggestFromName,
              {"FirstName": firstname, "LastName": lastname},
              function(data) {
      let alternates = $("#alternates").empty();
      if (data.succeeded) {
        $("span.email").text(data.addresses[0]);
        let cost = 20;
        for each (let [i, address] in Iterator(data.addresses)) {
          alternates.append($("<li class='address'></li>").data("address", address).append($("<span class='address'/>").text(address),
                                                                                           $("<button class='create'/>").text("$" + (cost + i*2) + "/ year")));
        }
        $("#notifications .success").show();
      }
      else {
        // Figure out what to do if it failed.
        $("#notifications .error").fadeIn();
      }
    });
  });

  $("#notifications").delegate("button.create", "click", function() {
    saveState();
    $("#chosen_email").text($(this).parent().data("address"));
    $("#FirstNameAccount").val($("#FirstName").val());
    $("#LastNameAccount").val($("#LastName").val());
    $("#window, #existing").hide();
    $("#new_account").fadeIn(3 * 1000);
  });

  $("button.check").click(function() {
    saveState();
    $("#notifications").show();
    var domain = $("#provider").find(":selected").attr("domain");
    var username = $("#username").val();
    $.getJSON(checkAddress,
              {"domain": domain, "username": username},
              function(data) {
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

  $("#back").click(function() {
    $("#FirstName").val($("#FirstNameAccount").val());
    $("#LastName").val($("#LastNameAccount").val());
    $("#window, #existing").show();
    $("#new_account").hide();
  });

  $("button.submit").click(function() {
    saveState();
    var inputs = $("#new_account :input").not("[readonly]").not("button");
    $.post(provision, inputs, function(data) {
      if (data.succeeded) {
        // Create the account using data.config!
        let config = readFromXML(new XML(data.config));
        let realname = $("#FirstName").val() + " " + $("#LastName").val();
        let email = $("#chosen_email").text();
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

  $("#FirstName").focus().select();
  $("#existing").fadeIn(3 * 1000);
});
