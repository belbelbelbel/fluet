import { MailtrapClient } from "mailtrap";

const TOKEN  = '9cc8152bc6cf7ded246698984121273c'
const SENDER_EMAIL = "hello@demomailtrap.com";
const recepient_email =  "gronaldchia@gmail.com "

if (!TOKEN) {
    throw new Error("Mailtrap API token not found");
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