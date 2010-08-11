function NewMailAccountProvisioner(aMsgWindow) {
  for (let i in window) dump("  ."+i+"\n");
  window.openDialog("chrome://accountprovisioner/content/accountProvisioner.xhtml",
                    "AccountSetup",
                    "chrome,titlebar,centerscreen,width=640,height=320",
                    {msgWindow:aMsgWindow});
}
