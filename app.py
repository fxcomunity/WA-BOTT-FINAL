import os
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
FONNTE_TOKEN = os.getenv("FONNTE_TOKEN", "")
ADMIN_PHONE = os.getenv("ADMIN_PHONE", "")

app = Flask(__name__)

def send_fonnte_message(target, text):
    """Fungsi helper untuk mengirim pesan menggunakan Fonnte API."""
    if not FONNTE_TOKEN or FONNTE_TOKEN == "ISI_TOKEN_FONNTE_KAMU_DISINI":
        print("Token Fonnte belum dikonfigurasi!")
        return False
        
    url = "https://api.fonnte.com/send"
    headers = {
        "Authorization": FONNTE_TOKEN
    }
    data = {
        "target": target,
        "message": text
    }
    try:
        response = requests.post(url, headers=headers, data=data)
        return response.json()
    except Exception as e:
        print("Error sending Fonnte message:", e)
        return False

@app.route('/')
def home():
    # Render the main page containing the WA widget
    return render_template('index.html')

@app.route('/api/send-widget', methods=['POST'])
def send_widget():
    """Endpoint yang dipanggil oleh widget ketika kategori diklik."""
    data = request.json
    user_phone = data.get('phone')
    command = data.get('command')
    category_title = data.get('title')

    if not user_phone or not command:
        return jsonify({"status": "error", "message": "Nomor atau command tidak valid"}), 400

    # 1. Kirim pesan ke user (Sapaan & panduan command)
    reply_message = f"Halo! 👋 Anda baru saja memilih kategori *{category_title}* melalui website kami.\n\nMemproses perintah: `{command}`..."
    send_fonnte_message(user_phone, reply_message)

    # 2. Kirim notifikasi ke Admin
    if ADMIN_PHONE:
        admin_msg = f"🔔 *Notifikasi Website*\nAda pengunjung baru!\nNomor: {user_phone}\nKategori: {category_title}"
        send_fonnte_message(ADMIN_PHONE, admin_msg)

    return jsonify({"status": "success", "message": "Pesan terkirim ke WhatsApp."})

@app.route('/webhook', methods=['POST'])
def webhook():
    """Endpoint Webhook untuk menerima pesan masuk dari Fonnte."""
    try:
        # Fonnte mengirimkan data sebagai Form Data atau JSON
        data = request.json if request.is_json else request.form.to_dict()
        print("Incoming Webhook Data:", data)

        sender = data.get("sender", "")
        message = data.get("message", "").strip().lower()

        # Contoh logika Auto-Reply sederhana via Fonnte Webhook
        if message == "!menu":
            # Mengirim Interactive List Message ala Tri
            list_message = {
                "target": sender,
                "message": "Halo! Silakan pilih menu di bawah ini:",
                "buttonJSON": '{"message":"Kategori Menu","footer":"JackBOT v3.0","buttons":[{"id":"btn_admin","message":"👑 Admin"},{"id":"btn_member","message":"👥 Member"},{"id":"btn_game","message":"🎮 Games"},{"id":"btn_ai","message":"🤖 Tanya AI"}]}'
            }
            url = "https://api.fonnte.com/send"
            headers = {"Authorization": FONNTE_TOKEN}
            requests.post(url, headers=headers, data=list_message)
            return jsonify({"status": "success"})
        
        elif message.startswith("bot, halo"):
            reply = "Halo! Saya adalah AI asisten pintar. Ada yang bisa saya bantu hari ini?"
            send_fonnte_message(sender, reply)
            return jsonify({"status": "success"})

        # Respons default
        return jsonify({"status": "ignored", "message": "Bukan command yang dikenali"})

    except Exception as e:
        print("Webhook Error:", e)
        return jsonify({"status": "error"}), 500

if __name__ == '__main__':
    # Run on all interfaces, port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
