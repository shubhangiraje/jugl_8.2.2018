/**
 * An Image Picker Plugin for Cordova/PhoneGap.
 */
package com.synconset;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

public class ImagePicker extends CordovaPlugin {
	public static String TAG = "ImagePicker";
	 
	private CallbackContext callbackContext;
	private JSONObject params;

	private String strProgressCaption;
	private String strProgressMessage;
	private String strMaxCountCaption1;
	private String strMaxCountCaption2;
	private String strMaxCountMessage1;
	private String strMaxCountMessage2;


	public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
		 this.callbackContext = callbackContext;
		 this.params = args.getJSONObject(0);
		if (action.equals("getPictures")) {
			Intent intent = new Intent(cordova.getActivity(), MultiImageChooserActivity.class);
			int max = 20;
			int desiredWidth = 0;
			int desiredHeight = 0;
			int quality = 100;
			if (this.params.has("maximumImagesCount")) {
				max = this.params.getInt("maximumImagesCount");
			}
			if (this.params.has("width")) {
				desiredWidth = this.params.getInt("width");
			}
			if (this.params.has("height")) {
				desiredHeight = this.params.getInt("height");
			}
			if (this.params.has("quality")) {
				quality = this.params.getInt("quality");
			}
			intent.putExtra("MAX_IMAGES", max);
			intent.putExtra("WIDTH", desiredWidth);
			intent.putExtra("HEIGHT", desiredHeight);
			intent.putExtra("QUALITY", quality);

			intent.putExtra("strProgressCaption", this.strProgressCaption);
			intent.putExtra("strProgressMessage", this.strProgressMessage);
			intent.putExtra("strMaxCountCaption1", this.strMaxCountCaption1);
			intent.putExtra("strMaxCountCaption2", this.strMaxCountCaption2);
			intent.putExtra("strMaxCountMessage1", this.strMaxCountMessage1);
			intent.putExtra("strMaxCountMessage2", this.strMaxCountMessage2);

			if (this.cordova != null) {
				this.cordova.startActivityForResult((CordovaPlugin) this, intent, 0);
			}
		}

		if (action.equals("setStrings")) {
		    if (this.params.has("progressCaption")) {
		        this.strProgressCaption=this.params.getString("progressCaption");
		    }
		    if (this.params.has("progressMessage")) {
		        this.strProgressMessage=this.params.getString("progressMessage");
		    }
		    if (this.params.has("maxCountCaption1")) {
		        this.strMaxCountCaption1=this.params.getString("maxCountCaption1");
		    }
		    if (this.params.has("maxCountCaption2")) {
		        this.strMaxCountCaption2=this.params.getString("maxCountCaption2");
		    }
		    if (this.params.has("maxCountMessage1")) {
		        this.strMaxCountMessage1=this.params.getString("maxCountMessage1");
		    }
		    if (this.params.has("maxCountMessage2")) {
		        this.strMaxCountMessage2=this.params.getString("maxCountMessage2");
		    }
		}

		return true;
	}
	
	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		if (resultCode == Activity.RESULT_OK && data != null) {
			ArrayList<String> fileNames = data.getStringArrayListExtra("MULTIPLEFILENAMES");
			JSONArray res = new JSONArray(fileNames);
			this.callbackContext.success(res);
		} else if (resultCode == Activity.RESULT_CANCELED && data != null) {
			String error = data.getStringExtra("ERRORMESSAGE");
			this.callbackContext.error(error);
		} else if (resultCode == Activity.RESULT_CANCELED) {
			JSONArray res = new JSONArray();
			this.callbackContext.success(res);
		} else {
			this.callbackContext.error("No images selected");
		}
	}
}
