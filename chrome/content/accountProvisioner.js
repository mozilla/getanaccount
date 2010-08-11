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
 * The Original Code is AccountProvisioner Code.
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

var providers = {
  "gmail.com" : "http://bwinton.latte.ca/work/provision/test.cgi",
  "yahoo.com" : "http://bwinton.latte.ca/work/provision/test.cgi",
};

var msgWindow;

$(function() {
  // Snarf the things I need out of the window arguments.
  msgWindow = window.arguments[0].msgWindow;

  $("#existing_iframe")[0].contentWindow.arguments = window.arguments;
  dump("11111: "+$("#existing_iframe")[0]+"\n");
  for (let i in $("#existing_iframe")[0]) dump("  ."+i+"\n");
  dump("22222: "+$("#existing_iframe")[0].contentWindow+"\n");
  for (let i in $("#existing_iframe")[0].contentWindow) dump("  ."+i+"\n");
  dump("33333: "+$("#existing_iframe")[0].contentDocument+"\n");
  for (let i in $("#existing_iframe")[0].contentDocument) dump("  ."+i+"\n");

  $("#provider").change(function() {
    var domain = $(this).find(":selected").attr("domain");
    $("#notifications .success").hide();
    $("#notifications .error").hide();
    $("#notifications").hide();
    $(".domain").text(domain);
  }).change();

  $("#username").keyup(function() {
    $("#notifications .success").hide();
    $("#notifications .error").hide();
    $("#notifications").hide();
    $(".username").text($(this).val());
  }).trigger('keyup');

  $("button.create").click(function() {
    $("#notifications").show();
    $("#existing").fadeOut(3 * 1000);
  });

  $("button.check").click(function() {
    $("#notifications").show();
    var domain = $("#provider").find(":selected").attr("domain");
    var username = $("#username").val();
    dump("domain="+domain+"\n");
    dump("username="+username+"\n");
    var handler = providers[domain] +
                  "?domain=" + domain +
                  "&username=" + username;
    $.getJSON(handler, function(data) {
      if (data.succeeded) {
        $("#notifications .success").fadeIn();
      }
      else {
        $("#notifications .options").html("");
        for (let i in data.alternates) {
          let alt = data.alternates[i]
          $("#notifications .options").append(
            "<li username='" + alt + "'>" + alt + "@" + data.domain + "</li>");
        };
        $("#notifications .error").fadeIn();
      }
    });
  });

  $(".options").delegate("li", "click", function() {
    $("#notifications .success").hide();
    $("#notifications .error").hide();
    $("#notifications").hide();
    $("#username").val($(this).attr("username")).trigger('keyup');
    $("button.create").effect('highlight', {}, 'slow');
  })

  $("#username").focus().select() ;
  $("#existing").fadeIn(3 * 1000);
});

function useExisting() {
  $("#window").hide();
  $("#existing").hide();
  $("#addExistingAccount").show();
};

function createNew() {
  $("#window").show();
  $("#existing").show();
  $("#addExistingAccount").hide();
};
