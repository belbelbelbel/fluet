import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const TOKEN = process.env.MAILTRAP_API_TOKEN;
const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL || "hello@demomailtrap.com";
const recepient_email = process.env.TEST_RECIPIENT_EMAIL || "gronaldchia@gmail.com";

if (!TOKEN) {
    throw new Error("Mailtrap API token not found. Please set MAILTRAP_API_TOKEN in your .env file");
}

const client = new MailtrapClient({ token: TOKEN });

client.send({
    from: {
        name: "Fluet",
        email: SENDER_EMAIL
    },
    to: [
        {
            name: "Bendee",
            email: recepient_email
        }
    ],
    subject: "Test email",
    text: "welcome to Fluet App"
})
.then(console.log)
.catch(console.error);