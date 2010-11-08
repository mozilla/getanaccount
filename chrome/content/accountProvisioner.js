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

/**
 * Save the state of this page to localstorage, so we can reconstitute it
 * later.
 */
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

var storedData = {};
var providers = {};
var currentProvider = "";

/**
 * Walk down a dotted key to get the object at the bottom, creating any
 * intermediate objects/arrays if necessary.
 */
function setObjectsForKey(root, key, value) {
  let obj = root;
  for each (let [i, part] in Iterator(key)) {
    let next = key[i+1];
    if (part == "0")
      part = 0;
    if (!(part in obj))
      if (next == "0")
        obj[part] = [{}];
      else
        obj[part] = {};

    if (i < key.length-1)
      obj = obj[part];
    else {
      if ($.isPlainObject(value))
        for (let i in value)
          obj[part][i] = value[i];
      else
        obj[part] = value;
    }
  }
}

/**
 * Turn a set of inputs with dotted names into an object with sub-objects.
 *
 * @param {jQuery Collection} inputs The inputs to convert.
 * @return {object} An object containing all the inputs.
 */
function objectify(inputs, provider) {
  var rv = {}
  $(provider.api.reverse()).each(function(index, item) {
    var key = item.id.split(".");
    var value;

    // Handle the special types.
    if (item.type == "stored_data") {
      // Populate the item from the stored data.
      setObjectsForKey(rv, key, storedData);
      return;
    }
    else if (item.type == "email") {
      value = $("#results .row.selected .create").attr("address");
    }
    else {
      value = inputs.filter("[name="+item.id+"]").attr("value");
    }
    if ((item.type == "credit_card") || (item.type == "num") ||
        (item.type == "year_future") || (item.type == "month"))
      value = value.replace(/\D+/g, '');

    value = value.trim();

    setObjectsForKey(rv, key, value);
  });
  return rv;
}


/**
 * Validate the credit card using the Luhn algorithm.
 *
 * @param {String} cc The credit card number.
 * @return {boolean} True if the credit card number is valid.
 */
function validateCreditCard(cc) {
  cc = cc.replace(/\D+/g, '')

  // Test credit card number == true.
  if (cc == "4111111111111111")
    return true;

  // Empty credit card number == false.
  if (!cc.length)
    return false;

  // Calculate the checksum according to:
  // http://en.wikipedia.org/wiki/Luhn_algorithm
  checksum = 0;
  for each (let [i, a] in Iterator(cc)) {
    a = parseInt(a, 10);
    if (((i % 2) == 0) || (a == 9))
      checksum += a;
    else if (a < 5)
      checksum += 2 * a;
    else
      checksum += (2 * a) % 9;
  }
  return (checksum % 10) == 0;
}


/**
 * Validate the values for a set of inputs, returning any errors.
 *
 * @param {jQuery Collection} inputs The inputs to validate.
 * @return {array} The (possibly-empty) array of errors.
 */
function validateForm(inputs) {
  let rv = {hasErrors: false};
  inputs.each(function(index, item) {
    let item = $(item);

    // Get the value.
    let value = item.attr("value").trim();
    if (item.hasClass("creditcard") || item.hasClass("num") ||
        item.hasClass("yearfuture"))
      value = value.replace(/\D+/g, '');

    // Check that required elements have a value.
    if (item.hasClass("required") && (item.attr("value") == "")) {
      rv[item.attr("id")] = "Missing required value.";
      rv.hasErrors = true;
      return;
    }

    let length = item.attr("length");
    if (length && (value.length > length)) {
      rv[item.attr("id")] = "Value too long.";
      rv.hasErrors = true;
      return;
    }

    // Check that credit cards pass the luhn check.
    if (item.hasClass("creditcard")) {
      if (!validateCreditCard(value)) {
        rv[item.attr("id")] = "Credit card number invalid.";
        rv.hasErrors = true;
        return;
      }
    }

    // Check that future years are in the future.
    if (item.hasClass("yearfuture")) {

      let expiryYear = parseInt(value, 10);
      let expiryMonth = parseInt(inputs.filter(".month").attr("value"), 10) - 1;
      let currentYear = new Date().getFullYear();
      let currentMonth = new Date().getMonth();

      if ((currentYear > expiryYear) ||
          ((currentYear == expiryYear) && (currentMonth > expiryMonth))) {
        rv[item.attr("id")] = "Credit card has expired.";
        rv.hasErrors = true;
        return;
      }
    }

    // Check that state_caus is there if the country is CA or US.
    if (item.hasClass("state_caus")) {
      let country = inputs.filter(".country").attr("value");
      if (((country == "CA") || (country == "US")) && (value == "")) {
        rv[item.attr("id")] = "Missing required value.";
        rv.hasErrors = true;
        return;
      }
    }

    // Check that the user has accepted the terms of service.
    if (value == "Accept" && !item.attr("checked")) {
      rv["accept_tos"] = "You must accept the Terms of Service.";
      rv.hasErrors = true;
      return;
    }

  });

  return rv;
}

/**
 * Display the errors for set of inputs in the specified form.
 *
 * @param {jQuery Collection} inputs The possibly-erroneous inputs.
 * @param {array} The (possibly-empty) array of errors.
 */
function displayErrors(inputs, errors) {
  // General errors go in $("#provision_form .error").text("");
  // value.next(".error").text(data.errors[i]);
  for (let i in errors) {
    // Populate the errors.
    if (i == "hasErrors")
      continue;

    let value = inputs.filter("#"+i.replace(".", "\\.", "g"));
    if (!value.length)
      // Assume it's a global error if we can't find the
      // specific element it applies to.
      value = $("#provision_form #global");
    value.siblings(".error").text(errors[i]);
  }
  return;
}

/**
 * Log a successful account creation, if we have a log url for that provider.
 *
 * @param provider The provider we created the account for.
 * @param config The created config.
 */
function logSuccess(provider, config) {
  let providerLogUrl = providers[currentProvider].log_url;
  if (providerLogUrl) {
    let data = {success: 'true',
                config: config };
    dump("Logging "+JSON.stringify(data)+" to "+providerLogUrl+"\n");
    $.ajax({url: providerLogUrl,
            type: 'POST',
            dataType: 'json',
            processData: false,
            contentType: 'text/json',
            data: JSON.stringify(data)});
  };
}

$(function() {
  // Snarf the things I need out of the window arguments.
  let NewMailAccount = window.arguments[0].NewMailAccount;
  let msgWindow = window.arguments[0].msgWindow;
  window.storage = getLocalStorage("accountProvisioner");
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
  let opener = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                         .getService(Components.interfaces.nsIExternalProtocolService)

  $(".external").click(function (e) {
    e.preventDefault();
    opener.loadUrl(ioService.newURI($(e.target).attr("href"), "UTF-8", null));
  });

  let prefs = Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefBranch);
  let providerList = prefs.getCharPref("extensions.accountprovisioner.providerList");
  let suggestFromName = prefs.getCharPref("extensions.accountprovisioner.suggestFromName");
  let checkAddress = prefs.getCharPref("extensions.accountprovisioner.checkAddress");

  $.getJSON(providerList, function(data) {
    providers = data;
    for each (let [i, provider] in Iterator(data)) {
      currentProvider = i;
      // Fill in #provision_form.
      for each (let [i, field] in Iterator(provider.api.reverse())) {
        field.extraClass = field.required ? "required" : "";
        $("#"+field.type+"_tmpl").render(field).prependTo($("#provision_form"));
      };
      // Update the terms of service and privacy policy links.
      $("a.tos").attr("href", provider.tos_url);
      $("a.privacy").attr("href", provider.privacy_url);
    };
  });
  let firstname = storage.getItem("firstname") || $("#FirstName").text();
  let lastname = storage.getItem("lastname") || $("#LastName").text();
  let username = storage.getItem("username");
  let domain = storage.getItem("domain");
  $("#FirstName").val(firstname);
  $("#LastName").val(lastname);
  saveState();

  let metaKey = false;

  $("#window").css("height", window.innerHeight - 1);

  $(window).keydown(function(e) {
      // Handle Cmd-W.
    if (e.keyCode == '224') {
      metaKey = true;
      Application.console.log("metaKey! " + metaKey);
    } else if (e.keyCode == '87' && ((e.ctrlKey && !e.altKey) || metaKey)) {
      // Handle Ctrl-W.
      window.close();
    } else {
      metaKey = false;
    }
  }).trigger("keydown");

  $(".search").click(function() {
    $("#notifications").children().hide();
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
    $("#notifications .spinner").show();
    $.getJSON(suggestFromName,
              {"first_name": firstname, "last_name": lastname},
              function(data) {
      let results = $("#results").empty();
      if (data.succeeded && data.addresses.length) {
        $("#FirstAndLastName").text(firstname + " " + lastname);
        results.append($("#resultsHeader").clone().removeClass('displayNone'));
        for each (let [i, address] in Iterator(data.addresses)) {
          $("#result_tmpl").render({"address": address, "price": data.price})
                           .appendTo(results);
        }
        results.append($("#resultsFooter").clone().removeClass('displayNone'));
        $("#notifications").children().hide();
        $("#notifications .success").show();
        storedData = data;
        delete storedData.succeeded
        delete storedData.addresses
        delete storedData.price
      }
      else {
        // Figure out what to do if it failed.
        $("#notifications").children().hide();
        $("#notifications .error").fadeIn();
      }
    });
  });

  $("#notifications").delegate("button.create", "click", function() {
    saveState();
    $(this).parents(".row").addClass("selected");
    $("#account\\.first_name").val($("#FirstName").val());
    $("#account\\.last_name").val($("#LastName").val());
    $("#results > .row:not(.selected), #search").hide();
    $(".header, .success .title, #existing").slideUp("fast", function() {
      $("#new_account").appendTo("#content").fadeIn("fast");
      $("button.create").hide();
      $("span.create").show();
    });
    $("#window").css("height", "auto");
  });

  $("#back").click(function() {
    $("#FirstName").val($("#account\\.first_name").val());
    $("#LastName").val($("#account\\.last_name").val());
    $("#window").css("height", window.innerHeight - 1);
    $("button.create").show();
    $("span.create").hide();
    $("#window, #existing").show();
    $("#provision_form .error").text("");
    $("#new_account").hide();
    $(".header, .success .title, #existing").slideDown();
    $("#results > .row, #search").removeClass("selected").show();
  });

  $("button.submit").click(function() {
    saveState();
    $("#provision_form .error").text("");
    let realname = $("#FirstName").val() + " " + $("#LastName").val();
    var inputs = $("#new_account").find(":input").not("[readonly]")
                                  .not("button");

    // Make sure we pass the client-side checks.
    let errors = validateForm(inputs);
    if (errors.hasErrors) {
      displayErrors(inputs, errors);
      return;
    }

    // Then add the information from this page.
    var data = objectify(inputs, providers[currentProvider]);
    let email = $("#results .row.selected .create").attr("address");
    $.ajax({url: providers[currentProvider].url,
            type: 'POST',
            dataType: 'json',
            processData: false,
            contentType: 'text/json',
            data: JSON.stringify(data),
            success: function(data) {
              dump("data="+JSON.stringify(data)+"\n");
              if (data.succeeded) {
                // Create the account using data.config!
                let password = data.password
                let config = readFromXML(new XML(data.config));
                replaceVariables(config, realname, email, password);
                createAccountInBackend(config);
                logSuccess(currentProvider, data.config);
                window.close();
              }
              else {
                displayErrors(inputs, data.errors);
              }
            }});
  });
  $("a.optional").click(function() {
    $.scrollTo($("#existing .message"), 1000, {onAfter: function(){
      $("#existing .message").effect("highlight", {}, 3000);
    } } );
  });

  $("button.existing").click(function() {
    saveState();
    NewMailAccount(msgWindow, undefined, NewMailAccount);
    window.close();
  });
});
