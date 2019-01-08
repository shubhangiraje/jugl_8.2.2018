=== AFTER PROJECT CHECKOUTING ===
cd src
npm install
build kendoui core

=== BUILDING KENDO-UI-CORE ===
cd <kendo-ui-core-lib>
git clone https://github.com/telerik/less.js.git build/less-js
npm run build

=== INSTALLING BUILDING PLATFORM ON UBUNTU ===

apt-get install npm ant
npm install -g cordova

# download and install android studio. while installing it downloads SDK API 21
# run sdk manager and install API 19,18,17 etc
# add "export ANDROID_HOME=~/Android/Sdk" to ~/.bashrc
# add "export JAVA_HOME=/usr/lib/jvm/java-8-oracle" to ~/.bashrc

=== INSTALLING BUILDING PLATFORM ON MAC ===

=== INSTALLING BUILDING PLATFORM ON WINDOWS ===
# Windows 8.1 Pro/Ultiate required
# install Visual Studio 2013 Community Edition, when installing select Phone SDK to install



== things to do after setuping project ===
iOS, Android: copy coins.wav to project folder for coins notification sound
WP: modify SupportedOrientations="Portrait" Orientation="Portrait" in MainPage.xaml
WP: in MainPage.xaml.cs add after InitializeComponent() following line: this.CordovaView.Height = Application.Current.Host.Content.ActualHeight - 2;



cordova-plugin-file
cordova-plugin-sms
cordova-plugin-inappbrowser
audioencode!!!!
videocaptureplus!!!
