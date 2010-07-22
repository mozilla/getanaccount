function NewMailAccountProvisioner(msgWindow) {
  window.openDialog("chrome://accountprovisioner/content/accountProvisioner.html",
                    "AccountSetup",
                    "chrome,titlebar,centerscreen,width=640,height=320",
                    {NewMailAccount:NewMailAccount, msgWindow:msgWindow});
  // Call NewMailAccount(msgWindow) to open up the old window.
}
