// export async function sendEmail({
//   to,
//   subject,
//   text,
// }: {
//   to: string;
//   subject: string;
//   text: string;
// }) {
//   console.log("=================================");
//   console.log("EMAIL");
//   console.log("To:", to);
//   console.log("Subject:", subject);
//   console.log("Message:", text);
//   console.log("=================================");
// }


// import { Resend } from "resend";

// const resend = new Resend(
//   process.env.RESEND_API_KEY,
// );

// export async function sendEmail({
//   to,
//   subject,
//   text,
// }: {
//   to: string;
//   subject: string;
//   text: string;
// }) {
//   if (!process.env.RESEND_API_KEY) {
//     throw new Error(
//       "RESEND_API_KEY is not configured",
//     );
//   }

//   const from =
//     process.env.EMAIL_FROM ||
//     "AI Resume Portfolio <onboarding@resend.dev>";

//   const { data, error } =
//     await resend.emails.send({
//       from,
//       to,
//       subject,
//       text,
//     });

//   if (error) {
//     console.error(
//       "Resend email error:",
//       error,
//     );

//     throw new Error(
//       error.message ||
//         "Failed to send email",
//     );
//   }

//   console.log(
//     "Email sent successfully:",
//     data?.id,
//   );

//   return data;
// }


import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY,
);

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured",
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured",
    );
  }

  const { data, error } =
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });

  if (error) {
    console.error(
      "Resend email error:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to send email",
    );
  }

  console.log(
    "Email sent successfully:",
    data?.id,
  );

  return data;
}