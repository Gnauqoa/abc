# InnoLab App


## Code Editor
* Visual Studio Code
* Code formatter extension: Prettier
* Prettier setting: Print Width = 120

## Install Dependencies
* Node.js v18.16.1
* First of all we need to install dependencies, run in terminal
```
npm install
```

## NPM Scripts

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production
* 📱 `build-cordova` - build cordova app
* 📱 `build-cordova-ios` - build cordova iOS app
* 📱 `cordova-ios` - run dev build cordova iOS app
* 📱 `build-cordova-android` - build cordova Android app
* 📱 `cordova-android` - run dev build cordova Android app
* 🖥 `build-cordova-electron` - build cordova Electron app
* 🖥 `cordova-electron` - run dev build cordova Electron app

## Build Android apk 
* Install Android Studio https://developer.android.com/studio
* Install Cordova:  
`npm install cordova -g`
* Set ANDROID_SDK_ROOT (path can be found from Android Studio):  
`setx ANDROID_SDK_ROOT "C:\Users\your-username\AppData\Local\Android\Sdk"`
* Remove and add Android platform:  
  `cd cordova`  
  `cordova platform remove android`  
  `cordova platform add android`  
* Run the app with usb cable: `npm run cordova-android`
* Build Android apk:  
`npm run build-cordova-android`
* Use Android studio to open existing project at ./cordova/platform/android
* Config Android Studio Settings: `File > Settings`
    * `Languages & Frameworks > Android SDK > SDK Tools`: Check `Show Package Details`, select `Android SDK Build-Tools: 34.0.0` version
    * `Build, Execution, Deployment > Build Tools > Gradle`: Select `Gradle SDK: GRADLE_LOCAL_JAVA_HOME`
* Android studio, click menu Build > Generated Signed Bundle / APK > APK.
    * Key store path: browse to key file at project_path/google-play/ohstemapp.jks
    * Key store password: Enter key store password
    * Key alias: ohstemapp
    * Key password: Enter key password

    * Click Next. In next screen, set Build Variants: release and click Create.

    * After file generated successfully, you can see apk file in project_path/cordova/platforms/android/app/release.

## Fix issue with microphone on Android
For Android app to be bable to record sound using builtin microphone, need to add following permission:
`<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`
in file cordova/platform/app/src/main/AndroidManifest.xml

## Fix issue with microphone on Android
For Android app to be bable to record sound using builtin microphone, need to add following permission:
`<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`
in file cordova/platform/app/src/main/AndroidManifest.xml

## PWA

This is a PWA. Don't forget to check what is inside of your `service-worker.js`. It is also recommended that you disable service worker (or enable "Update on reload") in browser dev tools during development.

## Cordova

Cordova project located in `cordova` folder. You shouldn't modify content of `cordova/www` folder. Its content will be correctly generated when you call `npm run cordova-build-prod`.

## Cordova Electron

There is also cordova Electron platform installed. To learn more about it and Electron check this guides:

* [Cordova Electron Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/electron/index.html)
* [Official Electron Documentation](https://electronjs.org/docs)

App requires serialport and its related npm packages to parse usb serial data so we need to install them in cordova/platforms/electron/www/ to build and run successfully, or we will meet error "Module not found when app starts". Run following commands to install:

`cd cordova/platforms/electron/www/`  
`npm install -s serialport @serialport/list @serialport/parser-readline @serialport/parser-delimiter`

## Framework7 CLI Options

Framework7 app created with following options:

```
{
  "cwd": "C:\\Data\\Mine\\edl_app",
  "type": [
    "pwa",
    "cordova"
  ],
  "name": "EDL App",
  "framework": "react",
  "template": "single-view",
  "bundler": "vite",
  "cssPreProcessor": "scss",
  "theming": {
    "customColor": false,
    "color": "#023a68",
    "darkTheme": false,
    "iconFonts": true,
    "fillBars": false
  },
  "customBuild": false,
  "pkg": "vn.ohstem.edl_app",
  "cordova": {
    "folder": "cordova",
    "platforms": [
      "ios",
      "android",
      "electron"
    ],
    "plugins": [
      "cordova-plugin-statusbar",
      "cordova-plugin-keyboard",
      "cordova-plugin-splashscreen"
    ]
  }
}
```

## Assets

Assets (icons, splash screens) source images located in `assets-src` folder. To generate your own icons and splash screen images, you will need to replace all assets in this directory with your own images (pay attention to image size and format), and run the following command in the project directory:

* First of all we need to install dependencies, run in terminal
```
npm install framework7-cli@7.0.1 -g
```
* Update the `cwd` attribute to the current project path in the `framework7.json` file

* Launch UI where you will be able to change icons and splash screens:

```
framework7 assets --ui --skipUpdate
```

## Documentation & Resources

* [Framework7 Core Documentation](https://framework7.io/docs/)

* [Framework7 React Documentation](https://framework7.io/react/)

* [Framework7 Icons Reference](https://framework7.io/icons/)
* [Community Forum](https://forum.framework7.io)
