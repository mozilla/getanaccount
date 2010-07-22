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

$(function() {
  // Snarf the things I need out of the window arguments.
  NewMailAccount = window.arguments[0].NewMailAccount;
  msgWindow = window.arguments[0].msgWindow;

  $("#provider").change(function() {
    var domain = $(this).find(":selected").attr("domain");
    $("#notifications").hide();
    $(".domain").text(domain);
  }).change();

  $("#username").keyup(function() {
    $("#notifications").hide();
    $(".username").text($(this).val());
  }).trigger('keyup');

  $("button.create").click(function() {
    $("#notifications").show();
    $("#notifications .error").fadeIn();
    $("#notifications .options").fadeIn();
  });

  $("button.check").click(function() {
    $("#notifications").show();
    $("#notifications .error").fadeIn();
    $("#notifications .options").fadeIn();
  });

  $(".options li").click(function() {
    $("#notifications").hide();
    $("#username").val($(this).attr("username")).trigger('keyup');
    $("button.create").effect('highlight', {}, 'slow');
  })

  $("#username").focus().select() ;
  $("#existing").fadeIn(3 * 1000);
});
