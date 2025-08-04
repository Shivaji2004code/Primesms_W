## 3. JSON payload cookbook

All requests use the same envelope:

{
"messaging_product": "whatsapp",
"recipient_type": "individual",
"to": "<DESTINATION_PHONE>",
"type": "template",
"template": { ... }
}

text

Fill the `template` object according to the chosen variant:

| Use-case                  | `template` object example                                                                                                                                                                        | Notes                                                                                  |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| **Body-only, no variables** | `{ "name":"order_ready","language":{"code":"en_US"} }`                                                                                                                                          | Quick to test – WhatsApp’s default `hello_world` template follows this form[60].       |
| **Body with variables**     | ```
{ "name":"ticket_update",
  "language":{"code":"en_US"},
  "components":[
    { "type":"body",
      "parameters":[
        { "type":"text","text":"Pablo" },
        { "type":"text","text":"#230332"}
      ]
    }
  ]
}
```                                                                                                    | Parameter order must match `{{1}}`, `{{2}}`, … positions[22].                         |
| **Header = text variable**  | ```
{ "name":"promo_header",
  "language":{"code":"en_US"},
  "components":[
    { "type":"header",
      "parameters":[{ "type":"text","text":"Summer Sale"}]
    },
    { "type":"body","parameters":[...] }
  ]
}
```                                                                                                     | Header variables addressed with `{{1}}` inside header component[35].                   |
| **Header = image variable** | ```
{ "name":"img_receipt",
  "language":{"code":"en_US"},
  "components":[
    { "type":"header",
      "parameters":[{ "type":"image","image":{ "link":"https://example.com/receipt.png" }}]
    },
    { "type":"body","parameters":[...] }
  ]
}
```                                                                                                   | Use `link` or uploaded media `id`[35].                                                 |
| **Quick-reply buttons**     | ```
{ "name":"opt_out",
  "language":{"code":"en_US"},
  "components":[
    { "type":"body","parameters":[] },
    { "type":"button","sub_type":"quick_reply","index":"0",
      "parameters":[{ "type":"payload","payload":"STOP_PROMO"}]
    }
  ]
}
```                                                                                                   | Buttons are separate `component` items; `payload` carries reply value[41].            |
| **CTA button – URL**        | Similar to quick-reply but `"sub_type":"url"`. Include URL placeholder in template; supply matching text param at send time[35].                                                               |
| **Authentication OTP**      | Use `AUTHENTICATION` category + one-time-password button; TTL ≤ 600 s added automatically[35].                                                                                             |
| **Location header**         | Build a header param with latitude, longitude, name, address (all strings)[35].                                                                                                         |

---

## 4. Bulk-send pattern for your SaaS

1. **Fetch credentials** once per tenant:

SELECT phone_number_id, access_token
FROM user_business_info
WHERE user_id = ?;

text
2. **Generate payload** for each recipient & template:

const payload = {
messaging_product: "whatsapp",
recipient_type: "individual",
to: customer_msisdn,
type: "template",
template: renderedTemplateObject // see §3
};

text
3. **POST** with exponential back-off on error 131049 (rate-limit)[35].  
4. **Concurrency:** ≤ 75 requests/s per WABA; queue accordingly[38].  
5. **Token rotation:** System-user tokens never expire but rotate on staff changes; update `token_expires_at`[48].  

---

## 5. Managing templates programmatically

* **Create / edit / delete**  
`POST /{waba_id}/message_templates` with `name`, `category` (`UTILITY`, `MARKETING`, `AUTHENTICATION`), `components`[8].
* **Read status**  
`GET /{waba_id}/message_templates?fields=name,status` → look for `APPROVED` before sending blasts[8].
* **Namespace**  
`GET /{waba_id}?fields=message_template_namespace`; cache it for partner BSP integrations[8].

---

## 6. Cursor + Claude workflow tips

1. **Prompt Cursor** with exact JSON skeletons (§3). Ask only to substitute variables & phone IDs to avoid missing-key errors[41].  
2. **Store skeletons** as JSON files; use “edit-in-place” to keep them DRY across SDKs.  
3. **Claude** excels at mapping SQL results → array of payload objects. Provide column names for code generation.  
4. **Unit-test** using the free test number before production; Claude can generate Jest/PyTest tests against the mock endpoint[60].  

---

## 7. Error-handling playbook

| HTTP code          | Meaning                         | Most frequent fix                                                                 |
|--------------------|---------------------------------|-----------------------------------------------------------------------------------|
| **401**            | Invalid or expired token        | Refresh system-user token; update DB[48].                                         |
| **400 (#132000)**  | Parameter count mismatch        | Ensure every `{{n}}` has a matching parameter in the payload[41].                 |
| **400 (#131047)**  | Media link inaccessible         | Host on HTTPS; include correct file extension in URL[35].                         |
| **400 (#131049)**  | Marketing frequency cap hit     | Retry later or switch to a UTILITY template[35].                                  |

---

## 8. Reference implementation (Node 18)

import axios from "axios";
import pg from "pg";

async function sendTemplate(userId, msisdn, tplName, params = []) {
const { rows:[creds] } =
await db.query(
"SELECT phone_number_id, access_token FROM user_business_info WHERE user_id=$1",
[userId]
);

const template = {
name: tplName,
language: { code: "en_US" },
...(params.length && {
components: [{
type: "body",
parameters: params.map(text => ({ type:"text", text }))
}]
})
};

const response = await axios.post(
https://graph.facebook.com/v20.0/${creds.phone_number_id}/messages,
{
messaging_product: "whatsapp",
recipient_type: "individual",
to: msisdn,
type: "template",
template
},
{
headers: {
Authorization: Bearer ${creds.access_token}
}
}
);
return response.data.messages.id; // wamid
}