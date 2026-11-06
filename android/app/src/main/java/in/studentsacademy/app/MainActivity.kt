package `in`.studentsacademy.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * Students Academy app.
 *  - Loads the portal in a WebView.
 *  - SMS: sent in the background from the phone's own SIM (free with the SIM's SMS pack).
 *    Sent/delivered status is reported back to the web page -> stored in the message log.
 *  - WhatsApp: free click-to-chat. A queue opens each chat with the text pre-filled; when the user
 *    taps Send and returns, the next chat opens automatically.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private lateinit var swipe: SwipeRefreshLayout
    private lateinit var progress: ProgressBar
    private lateinit var offline: LinearLayout
    private val siteHost: String = Uri.parse(BuildConfig.SITE_URL).host ?: ""
    @Volatile private var currentHost: String = ""
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingSms: (() -> Unit)? = null
    private val main = Handler(Looper.getMainLooper())
    private val smsExecutor = Executors.newSingleThreadExecutor()

    // WhatsApp queue
    private var waQueue: JSONArray? = null
    private var waIndex = 0
    private var waAwaitingReturn = false

    companion object {
        const val ACTION_SENT = "in.studentsacademy.app.SMS_SENT"
        const val ACTION_DELIVERED = "in.studentsacademy.app.SMS_DELIVERED"
        const val SMS_GAP_MS = 2500L
    }

    private val smsPermission = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
        if (res[Manifest.permission.SEND_SMS] == true) pendingSms?.invoke()
        else toast("SMS permission denied — enable it in Settings › Apps › Students Academy › Permissions")
        pendingSms = null
    }
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val data = res.data
        val uris: Array<Uri>? = when {
            res.resultCode != RESULT_OK -> null
            data?.clipData != null -> Array(data.clipData!!.itemCount) { data.clipData!!.getItemAt(it).uri }
            data?.data != null -> arrayOf(data.data!!)
            else -> null
        }
        fileCallback?.onReceiveValue(uris); fileCallback = null
    }

    /** Receives sent / delivered reports for every SMS part and forwards them to the web page. */
    private val smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
            val id = intent.getStringExtra("id") ?: return
            val status = when (intent.action) {
                ACTION_SENT -> if (resultCode == Activity.RESULT_OK) "sent" else "failed"
                ACTION_DELIVERED -> "delivered"
                else -> return
            }
            js("window.SAApp && window.SAApp.onSmsStatus(${JSONObject.quote(id)}, '$status')")
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        web = findViewById(R.id.webview); swipe = findViewById(R.id.swipe)
        progress = findViewById(R.id.progress); offline = findViewById(R.id.offline)

        val filter = IntentFilter().apply { addAction(ACTION_SENT); addAction(ACTION_DELIVERED) }
        ContextCompat.registerReceiver(this, smsReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            userAgentString = "$userAgentString StudentsAcademyApp/1.1"
        }
        web.addJavascriptInterface(Bridge(), "AndroidBridge")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val uri = req.url
                return when {
                    uri.host == siteHost && uri.scheme == "https" -> false
                    uri.host?.endsWith(".supabase.co") == true -> false
                    else -> { openExternal(uri); true }   // tel:, sms:, wa.me, PDFs, maps…
                }
            }
            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) { currentHost = Uri.parse(url).host ?: "" }
            override fun onPageFinished(view: WebView, url: String) { swipe.isRefreshing = false; currentHost = Uri.parse(url).host ?: "" }
            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) { offline.visibility = View.VISIBLE; swipe.isRefreshing = false }
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, p: Int) { progress.progress = p; progress.visibility = if (p < 100) View.VISIBLE else View.GONE }
            override fun onShowFileChooser(view: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null); fileCallback = cb
                return try { filePicker.launch(params.createIntent().putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)); true }
                catch (e: ActivityNotFoundException) { fileCallback = null; false }
            }
        }
        web.setDownloadListener { url, ua, cd, mime, _ ->
            if (url.startsWith("data:")) { toast("Open this file from the website to download"); return@setDownloadListener }
            try {
                val name = URLUtil.guessFileName(url, cd, mime)
                val req = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(mime); addRequestHeader("User-Agent", ua); setTitle(name)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
                }
                (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(req); toast("Downloading $name")
            } catch (e: Exception) { openExternal(Uri.parse(url)) }
        }

        swipe.setColorSchemeColors(ContextCompat.getColor(this, R.color.navy))
        swipe.setOnRefreshListener { web.reload() }
        swipe.setOnChildScrollUpCallback { _, _ -> web.scrollY > 0 }
        findViewById<Button>(R.id.retry).setOnClickListener { if (isOnline()) { offline.visibility = View.GONE; web.reload() } }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { if (web.canGoBack()) web.goBack() else finish() }
        })

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl(intent?.data?.takeIf { it.host == siteHost }?.toString() ?: "${BuildConfig.SITE_URL}/portal")
        if (!isOnline()) offline.visibility = View.VISIBLE
    }

    override fun onResume() {
        super.onResume()
        // Came back from WhatsApp -> continue the queue
        if (waAwaitingReturn) { waAwaitingReturn = false; main.postDelayed({ promptNextWhatsApp() }, 400) }
    }

    override fun onDestroy() {
        try { unregisterReceiver(smsReceiver) } catch (_: Exception) {}
        smsExecutor.shutdown(); super.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); web.saveState(outState) }

    // ---------------- helpers ----------------
    private fun js(code: String) = main.post { web.evaluateJavascript(code, null) }
    private fun openExternal(uri: Uri) {
        try { startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
        catch (e: ActivityNotFoundException) { toast("No app found to open this link") }
    }
    private fun toast(msg: String) = main.post { Toast.makeText(this, msg, Toast.LENGTH_LONG).show() }
    private fun isOnline(): Boolean {
        val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        return cm.getNetworkCapabilities(cm.activeNetwork)?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    }
    private fun hasPerm(p: String) = ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    private fun smsManager(subId: Int): SmsManager {
        val base: SmsManager = if (Build.VERSION.SDK_INT >= 31) getSystemService(SmsManager::class.java) else @Suppress("DEPRECATION") SmsManager.getDefault()
        return if (subId >= 0) base.createForSubscriptionId(subId) else base
    }

    private fun withSmsPermission(action: () -> Unit) = main.post {
        if (hasPerm(Manifest.permission.SEND_SMS)) action()
        else { pendingSms = action; smsPermission.launch(arrayOf(Manifest.permission.SEND_SMS, Manifest.permission.READ_PHONE_STATE)) }
    }

    private var reqCode = 0
    private fun statusIntent(action: String, id: String): PendingIntent =
        PendingIntent.getBroadcast(this, reqCode++, Intent(action).setPackage(packageName).putExtra("id", id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun sendOne(id: String, phone: String, text: String, subId: Int): Boolean = try {
        val sm = smsManager(subId); val parts = sm.divideMessage(text)
        if (parts.size > 1) {
            val sent = ArrayList<PendingIntent>(); val del = ArrayList<PendingIntent>()
            parts.forEachIndexed { i, _ -> sent.add(statusIntent(ACTION_SENT, if (i == parts.size - 1) id else "")); del.add(statusIntent(ACTION_DELIVERED, if (i == parts.size - 1) id else "")) }
            sm.sendMultipartTextMessage(phone, null, parts, sent, del)
        } else sm.sendTextMessage(phone, null, text, statusIntent(ACTION_SENT, id), statusIntent(ACTION_DELIVERED, id))
        true
    } catch (e: Exception) { if (id.isNotEmpty()) js("window.SAApp && window.SAApp.onSmsStatus(${JSONObject.quote(id)}, 'failed')"); false }

    // ---------------- WhatsApp queue ----------------
    private fun whatsappPackage(): String? = listOf("com.whatsapp", "com.whatsapp.w4b").firstOrNull {
        try { packageManager.getPackageInfo(it, 0); true } catch (e: Exception) { false }
    }
    private fun launchWhatsApp(phone: String, text: String) {
        val uri = Uri.parse("https://wa.me/$phone?text=" + Uri.encode(text))
        val intent = Intent(Intent.ACTION_VIEW, uri).apply { whatsappPackage()?.let { setPackage(it) } }
        try { startActivity(intent) } catch (e: Exception) { openExternal(uri) }
    }
    private fun openWaAt(i: Int) {
        val q = waQueue ?: return
        if (i >= q.length()) { toast("WhatsApp queue finished: ${q.length()} chats"); waQueue = null; return }
        waIndex = i
        val o = q.getJSONObject(i)
        js("window.SAApp && window.SAApp.onWaStatus(${JSONObject.quote(o.optString("id"))}, 'opened')")
        waAwaitingReturn = true
        launchWhatsApp(o.getString("phone"), o.getString("text"))
    }
    private fun promptNextWhatsApp() {
        val q = waQueue ?: return
        val next = waIndex + 1
        if (next >= q.length()) { toast("All ${q.length()} WhatsApp chats done"); waQueue = null; return }
        val o = q.getJSONObject(next)
        AlertDialog.Builder(this)
            .setTitle("WhatsApp ${next + 1} of ${q.length()}")
            .setMessage("Next: ${o.optString("name", o.getString("phone"))}")
            .setPositiveButton("Open next") { _, _ -> openWaAt(next) }
            .setNeutralButton("Skip") { _, _ -> waIndex = next; promptNextWhatsApp() }
            .setNegativeButton("Stop") { _, _ -> waQueue = null }
            .setCancelable(false).show()
    }

    /** JavaScript bridge — only honoured for pages served from the academy's own domain. */
    inner class Bridge {
        private fun trusted() = currentHost == siteHost

        @JavascriptInterface fun isApp(): Boolean = true

        @JavascriptInterface fun getSims(): String {
            if (!trusted()) return "[]"
            if (!hasPerm(Manifest.permission.READ_PHONE_STATE)) {
                main.post { smsPermission.launch(arrayOf(Manifest.permission.SEND_SMS, Manifest.permission.READ_PHONE_STATE)) }
                return "[]"
            }
            return try {
                val sm = getSystemService(SubscriptionManager::class.java)
                @SuppressLint("MissingPermission") val list = sm.activeSubscriptionInfoList ?: emptyList()
                JSONArray(list.map { JSONObject().put("id", it.subscriptionId).put("label", "SIM ${it.simSlotIndex + 1} — ${it.carrierName ?: it.displayName}") }).toString()
            } catch (e: Exception) { "[]" }
        }

        @JavascriptInterface fun sendSMS(phone: String, text: String, subId: Int) {
            if (!trusted()) return
            withSmsPermission { smsExecutor.execute { toast(if (sendOne("", phone, text, subId)) "SMS sent to $phone" else "SMS failed for $phone") } }
        }

        @JavascriptInterface fun sendBulkSMS(json: String, subId: Int) {
            if (!trusted()) return
            val arr = try { JSONArray(json) } catch (e: Exception) { return }
            withSmsPermission {
                toast("Sending ${arr.length()} SMS from this phone's SIM…")
                smsExecutor.execute {
                    var ok = 0
                    for (i in 0 until arr.length()) {
                        val o = arr.getJSONObject(i)
                        if (sendOne(o.optString("id"), o.getString("phone"), o.getString("text"), subId)) ok++
                        if (i < arr.length() - 1) Thread.sleep(SMS_GAP_MS)   // pacing avoids carrier spam filters
                    }
                    toast("SMS queue done: $ok of ${arr.length()} handed to the SIM")
                }
            }
        }

        @JavascriptInterface fun openWhatsApp(phone: String, text: String) {
            if (!trusted()) return
            main.post { launchWhatsApp(phone, text) }
        }

        @JavascriptInterface fun openWhatsAppQueue(json: String) {
            if (!trusted()) return
            val arr = try { JSONArray(json) } catch (e: Exception) { return }
            if (arr.length() == 0) return
            main.post {
                if (whatsappPackage() == null) { toast("WhatsApp is not installed on this phone"); return@post }
                waQueue = arr; openWaAt(0)
            }
        }
    }
}
