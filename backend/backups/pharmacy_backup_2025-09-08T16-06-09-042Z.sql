--
-- PostgreSQL database dump
--

\restrict gQjhR345K9GKaxVXtFWVjH2hWoO7M2VsEpfv12RXQA9CC0Lu4VBZRTfB9uYfgNg

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg120+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg12+1)

-- Started on 2025-09-08 16:06:09 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY clinic_dev."TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_patientId_fkey";
ALTER TABLE ONLY clinic_dev."TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_doctorId_fkey";
ALTER TABLE ONLY clinic_dev."StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";
ALTER TABLE ONLY clinic_dev."StockAlert" DROP CONSTRAINT "StockAlert_productId_fkey";
ALTER TABLE ONLY clinic_dev."Session" DROP CONSTRAINT "Session_userId_fkey";
ALTER TABLE ONLY clinic_dev."SalesReport" DROP CONSTRAINT "SalesReport_productId_fkey";
ALTER TABLE ONLY clinic_dev."Purchase" DROP CONSTRAINT "Purchase_userId_fkey";
ALTER TABLE ONLY clinic_dev."Purchase" DROP CONSTRAINT "Purchase_supplierId_fkey";
ALTER TABLE ONLY clinic_dev."PurchaseItem" DROP CONSTRAINT "PurchaseItem_purchaseId_fkey";
ALTER TABLE ONLY clinic_dev."PurchaseItem" DROP CONSTRAINT "PurchaseItem_productId_fkey";
ALTER TABLE ONLY clinic_dev."Product" DROP CONSTRAINT "Product_categoryId_fkey";
ALTER TABLE ONLY clinic_dev."Prescription" DROP CONSTRAINT "Prescription_productId_fkey";
ALTER TABLE ONLY clinic_dev."Prescription" DROP CONSTRAINT "Prescription_medicalRecordId_fkey";
ALTER TABLE ONLY clinic_dev."Payment" DROP CONSTRAINT "Payment_orderId_fkey";
ALTER TABLE ONLY clinic_dev."Order" DROP CONSTRAINT "Order_userId_fkey";
ALTER TABLE ONLY clinic_dev."Order" DROP CONSTRAINT "Order_patientId_fkey";
ALTER TABLE ONLY clinic_dev."OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE ONLY clinic_dev."OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";
ALTER TABLE ONLY clinic_dev."MedicalRecord" DROP CONSTRAINT "MedicalRecord_patientId_fkey";
ALTER TABLE ONLY clinic_dev."MedicalRecord" DROP CONSTRAINT "MedicalRecord_doctorId_fkey";
ALTER TABLE ONLY clinic_dev."MedicalRecord" DROP CONSTRAINT "MedicalRecord_appointmentId_fkey";
ALTER TABLE ONLY clinic_dev."Invoice" DROP CONSTRAINT "Invoice_paymentId_fkey";
ALTER TABLE ONLY clinic_dev."Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";
ALTER TABLE ONLY clinic_dev."Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";
ALTER TABLE ONLY clinic_dev."Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";
ALTER TABLE ONLY clinic_dev."Account" DROP CONSTRAINT "Account_userId_fkey";
DROP INDEX clinic_dev."User_username_key";
DROP INDEX clinic_dev."User_email_key";
DROP INDEX clinic_dev."Session_sessionToken_key";
DROP INDEX clinic_dev."Product_status_product_type_idx";
DROP INDEX clinic_dev."Product_status_isDelete_idx";
DROP INDEX clinic_dev."Product_status_idx";
DROP INDEX clinic_dev."Product_status_categoryId_idx";
DROP INDEX clinic_dev."Product_sku_key";
DROP INDEX clinic_dev."Product_product_type_idx";
DROP INDEX clinic_dev."Product_product_name_idx";
DROP INDEX clinic_dev."Product_isDelete_idx";
DROP INDEX clinic_dev."Product_created_at_idx";
DROP INDEX clinic_dev."Product_categoryId_idx";
DROP INDEX clinic_dev."Product_barcode_key";
DROP INDEX clinic_dev."Invoice_paymentId_key";
DROP INDEX clinic_dev."Invoice_orderId_key";
DROP INDEX clinic_dev."Invoice_invoice_number_key";
DROP INDEX clinic_dev."Category_name_key";
DROP INDEX clinic_dev."Category_code_key";
DROP INDEX clinic_dev."Account_provider_providerAccountId_key";
ALTER TABLE ONLY clinic_dev."User" DROP CONSTRAINT "User_pkey";
ALTER TABLE ONLY clinic_dev."TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_pkey";
ALTER TABLE ONLY clinic_dev."Supplier" DROP CONSTRAINT "Supplier_pkey";
ALTER TABLE ONLY clinic_dev."StockMovement" DROP CONSTRAINT "StockMovement_pkey";
ALTER TABLE ONLY clinic_dev."StockAlert" DROP CONSTRAINT "StockAlert_pkey";
ALTER TABLE ONLY clinic_dev."Session" DROP CONSTRAINT "Session_pkey";
ALTER TABLE ONLY clinic_dev."SalesReport" DROP CONSTRAINT "SalesReport_pkey";
ALTER TABLE ONLY clinic_dev."Purchase" DROP CONSTRAINT "Purchase_pkey";
ALTER TABLE ONLY clinic_dev."PurchaseItem" DROP CONSTRAINT "PurchaseItem_pkey";
ALTER TABLE ONLY clinic_dev."Product" DROP CONSTRAINT "Product_pkey";
ALTER TABLE ONLY clinic_dev."Prescription" DROP CONSTRAINT "Prescription_pkey";
ALTER TABLE ONLY clinic_dev."Payment" DROP CONSTRAINT "Payment_pkey";
ALTER TABLE ONLY clinic_dev."Patient" DROP CONSTRAINT "Patient_pkey";
ALTER TABLE ONLY clinic_dev."Order" DROP CONSTRAINT "Order_pkey";
ALTER TABLE ONLY clinic_dev."OrderItem" DROP CONSTRAINT "OrderItem_pkey";
ALTER TABLE ONLY clinic_dev."MedicalRecord" DROP CONSTRAINT "MedicalRecord_pkey";
ALTER TABLE ONLY clinic_dev."Invoice" DROP CONSTRAINT "Invoice_pkey";
ALTER TABLE ONLY clinic_dev."DailyReport" DROP CONSTRAINT "DailyReport_pkey";
ALTER TABLE ONLY clinic_dev."Category" DROP CONSTRAINT "Category_pkey";
ALTER TABLE ONLY clinic_dev."Appointment" DROP CONSTRAINT "Appointment_pkey";
ALTER TABLE ONLY clinic_dev."Account" DROP CONSTRAINT "Account_pkey";
DROP TABLE clinic_dev."User";
DROP TABLE clinic_dev."TreatmentPlan";
DROP TABLE clinic_dev."Supplier";
DROP TABLE clinic_dev."StockMovement";
DROP TABLE clinic_dev."StockAlert";
DROP TABLE clinic_dev."Session";
DROP TABLE clinic_dev."SalesReport";
DROP TABLE clinic_dev."PurchaseItem";
DROP TABLE clinic_dev."Purchase";
DROP TABLE clinic_dev."Product";
DROP TABLE clinic_dev."Prescription";
DROP TABLE clinic_dev."Payment";
DROP TABLE clinic_dev."Patient";
DROP TABLE clinic_dev."OrderItem";
DROP TABLE clinic_dev."Order";
DROP TABLE clinic_dev."MedicalRecord";
DROP TABLE clinic_dev."Invoice";
DROP TABLE clinic_dev."DailyReport";
DROP TABLE clinic_dev."Category";
DROP TABLE clinic_dev."Appointment";
DROP TABLE clinic_dev."Account";
DROP SCHEMA clinic_dev;
--
-- TOC entry 6 (class 2615 OID 27519)
-- Name: clinic_dev; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA clinic_dev;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 236 (class 1259 OID 27697)
-- Name: Account; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- TOC entry 228 (class 1259 OID 27630)
-- Name: Appointment; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Appointment" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    appointment_time timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'scheduled'::text,
    reason text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 27539)
-- Name: Category; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Category" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    code text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 27665)
-- Name: DailyReport; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."DailyReport" (
    id text NOT NULL,
    report_date timestamp(3) without time zone NOT NULL,
    total_sales double precision,
    total_orders integer,
    total_patients integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdByUserId" text,
    created_by_username text
);


--
-- TOC entry 223 (class 1259 OID 27587)
-- Name: Invoice; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Invoice" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "paymentId" text,
    invoice_number text NOT NULL,
    issued_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_amount double precision NOT NULL,
    "createdByUserId" text,
    created_by_username text
);


--
-- TOC entry 229 (class 1259 OID 27640)
-- Name: MedicalRecord; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."MedicalRecord" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "appointmentId" text,
    symptoms text,
    diagnosis text,
    treatment text,
    notes text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 27560)
-- Name: Order; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Order" (
    id text NOT NULL,
    "userId" text,
    "patientId" text,
    order_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'completed'::text,
    total_amount double precision,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_walkin boolean DEFAULT false NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 27572)
-- Name: OrderItem; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL,
    product_name text,
    product_unit text
);


--
-- TOC entry 217 (class 1259 OID 27530)
-- Name: Patient; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Patient" (
    id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth timestamp(3) without time zone,
    gender text,
    phone text,
    email text,
    address text,
    photo_url text,
    photo_path text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 27579)
-- Name: Payment; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    payment_type text NOT NULL,
    amount double precision NOT NULL,
    payment_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details text
);


--
-- TOC entry 230 (class 1259 OID 27649)
-- Name: Prescription; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Prescription" (
    id text NOT NULL,
    "medicalRecordId" text NOT NULL,
    "productId" text NOT NULL,
    dosage text,
    dosage_unit text,
    times_per_day integer,
    duration_days integer,
    instructions text,
    product_name text,
    product_unit text
);


--
-- TOC entry 219 (class 1259 OID 27548)
-- Name: Product; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Product" (
    id text NOT NULL,
    product_name text NOT NULL,
    product_type text,
    generic_name text,
    short_name text,
    status text DEFAULT 'active'::text,
    vat_percent double precision DEFAULT 0,
    expiration_warning_date integer,
    sale_price double precision NOT NULL,
    unit text,
    pack_size text,
    reorder_point integer,
    cost double precision,
    sku text,
    barcode text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    volume double precision,
    volume_unit text,
    shelf_code text,
    shelf_row text,
    "categoryId" text,
    symptom_category text,
    license_number text,
    dosage_unit text,
    dosage text,
    times_per_day integer,
    interval_hours integer,
    before_meal boolean,
    after_meal boolean,
    after_meal_immediate boolean,
    morning text,
    noon text,
    evening text,
    before_bed text,
    properties text,
    usage_instruction text,
    sale_note text,
    purchase_note text,
    image_url text,
    image_path text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 27604)
-- Name: Purchase; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Purchase" (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    "userId" text,
    purchase_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_amount double precision,
    status text DEFAULT 'received'::text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 27615)
-- Name: PurchaseItem; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."PurchaseItem" (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    unit_cost double precision NOT NULL,
    total_cost double precision NOT NULL,
    product_name text,
    product_unit text
);


--
-- TOC entry 234 (class 1259 OID 27682)
-- Name: SalesReport; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."SalesReport" (
    id text NOT NULL,
    report_date timestamp(3) without time zone NOT NULL,
    "productId" text NOT NULL,
    quantity_sold integer,
    total_sales double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdByUserId" text,
    created_by_username text,
    product_name text,
    product_unit text
);


--
-- TOC entry 235 (class 1259 OID 27690)
-- Name: Session; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 27673)
-- Name: StockAlert; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."StockAlert" (
    id text NOT NULL,
    "productId" text NOT NULL,
    alert_type text,
    alert_message text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdByUserId" text,
    created_by_username text,
    acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_at timestamp(3) without time zone,
    product_name text,
    product_unit text
);


--
-- TOC entry 227 (class 1259 OID 27622)
-- Name: StockMovement; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."StockMovement" (
    id text NOT NULL,
    "productId" text NOT NULL,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    reference_table text,
    reference_id text,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdByUserId" text,
    created_by_username text,
    product_name text,
    product_unit text
);


--
-- TOC entry 224 (class 1259 OID 27595)
-- Name: Supplier; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."Supplier" (
    id text NOT NULL,
    name text NOT NULL,
    contact_name text,
    phone text,
    email text,
    address text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 27656)
-- Name: TreatmentPlan; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."TreatmentPlan" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    plan_details text,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 27520)
-- Name: User; Type: TABLE; Schema: clinic_dev; Owner: -
--

CREATE TABLE clinic_dev."User" (
    id text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text,
    avatar_path text,
    "isDelete" boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 3571 (class 0 OID 27697)
-- Dependencies: 236
-- Data for Name: Account; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- TOC entry 3563 (class 0 OID 27630)
-- Dependencies: 228
-- Data for Name: Appointment; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Appointment" (id, "patientId", "doctorId", appointment_time, status, reason, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3553 (class 0 OID 27539)
-- Dependencies: 218
-- Data for Name: Category; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Category" (id, name, description, code, "isDelete", created_at, updated_at) FROM stdin;
cmf9sjql40001mnc06m6kqsod	เวชภัณฑ์ / เครื่องมือแพทย์	MEDICAL SUPPLIES / EQUIPMENT	MED001	f	2025-09-07 14:31:30.904	2025-09-07 14:31:30.904
cmf9sjql60002mnc0bkuwj72w	เม็ดเดียด อื่นๆ	OTHER	OTH001	f	2025-09-07 14:31:30.906	2025-09-07 14:31:30.906
cmf9sjql70003mnc0f398mgxm	เครื่องสำอาง / ผลิตภัณฑ์บำรุงผิว	COSMETICS	COS001	f	2025-09-07 14:31:30.908	2025-09-07 14:31:30.908
cmf9sjql90004mnc0owr8z52l	สมุนไพร / แผนโบราณ	HERBAL	HER001	f	2025-09-07 14:31:30.909	2025-09-07 14:31:30.909
cmf9sjqla0005mnc06zxpae70	วิตามิน / อาหารเสริม / อาหารทางการแพทย์	SUPPLEMENTS	SUP001	f	2025-09-07 14:31:30.911	2025-09-07 14:31:30.911
cmf9sjqlc0006mnc0qga2p9k7	วัตถุอันตราย	ใส่พบคำอธิบาย	\N	f	2025-09-07 14:31:30.912	2025-09-07 14:31:30.912
cmf9sjqld0007mnc02vrhz5t5	ยาใช้เฉพาะที่	TOPICAL MEDICATION	TOP001	f	2025-09-07 14:31:30.914	2025-09-07 14:31:30.914
cmf9sjqlf0008mnc0rbmhrnj6	ยาใช้ภายใน	ใส่พบคำอธิบาย	\N	f	2025-09-07 14:31:30.915	2025-09-07 14:31:30.915
cmf9sjqlg0009mnc0unfc3ink	ยาใช้ภายนอก	DRUG FOR EXTERNAL USE	EXT001	f	2025-09-07 14:31:30.916	2025-09-07 14:31:30.916
cmf9sjqlj000amnc0ymqbr9vk	ยาแผนโบราณ	ใส่พบคำอธิบาย	\N	f	2025-09-07 14:31:30.919	2025-09-07 14:31:30.919
cmf9sjqlk000bmnc0r22c0s8x	ยาแผนปัจจุบัน	ใส่พบคำอธิบาย	\N	f	2025-09-07 14:31:30.921	2025-09-07 14:31:30.921
cmf9sjqlm000cmnc0k4e0xtfi	ยาอันตราย	PRESCRIPTION	PRE001	f	2025-09-07 14:31:30.922	2025-09-07 14:31:30.922
cmf9sjqln000dmnc00wl7rikm	ยาสามัญประจำบ้าน	HOUSEHOLD	HOU001	f	2025-09-07 14:31:30.924	2025-09-07 14:31:30.924
cmf9sjqlp000emnc0rrkcl9nb	ยาบรรจุเสร็จ	NONPRESCRIPTION	NON001	f	2025-09-07 14:31:30.925	2025-09-07 14:31:30.925
cmf9sjqlq000fmnc06qpzvz5p	ยาอื่น	ใส่พบคำอธิบาย	\N	f	2025-09-07 14:31:30.926	2025-09-07 14:31:30.926
cmf9sjqlr000gmnc04etd0ae4	ยาควบคุมพิเศษ	RESTRICT	RES001	f	2025-09-07 14:31:30.928	2025-09-07 14:31:30.928
\.


--
-- TOC entry 3567 (class 0 OID 27665)
-- Dependencies: 232
-- Data for Name: DailyReport; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."DailyReport" (id, report_date, total_sales, total_orders, total_patients, created_at, "createdByUserId", created_by_username) FROM stdin;
\.


--
-- TOC entry 3558 (class 0 OID 27587)
-- Dependencies: 223
-- Data for Name: Invoice; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Invoice" (id, "orderId", "paymentId", invoice_number, issued_at, total_amount, "createdByUserId", created_by_username) FROM stdin;
cmfastl8j000dmn08zqc94kkc	cmfastl6q0001mn08c4vdyccr	cmfastl8d000bmn083p80qsa4	INV-1757316416704-vdyccr	2025-09-08 07:26:56.708	123	cmf9sjql10000mnc0uzibmwy5	admin
\.


--
-- TOC entry 3564 (class 0 OID 27640)
-- Dependencies: 229
-- Data for Name: MedicalRecord; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."MedicalRecord" (id, "patientId", "doctorId", "appointmentId", symptoms, diagnosis, treatment, notes, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3555 (class 0 OID 27560)
-- Dependencies: 220
-- Data for Name: Order; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Order" (id, "userId", "patientId", order_date, status, total_amount, "isDelete", created_at, updated_at, is_walkin) FROM stdin;
cmfastl6q0001mn08c4vdyccr	cmf9sjql10000mnc0uzibmwy5	\N	2025-09-08 07:26:56.643	completed	123	f	2025-09-08 07:26:56.643	2025-09-08 07:26:56.643	t
\.


--
-- TOC entry 3556 (class 0 OID 27572)
-- Dependencies: 221
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."OrderItem" (id, "orderId", "productId", quantity, unit_price, total_price, product_name, product_unit) FROM stdin;
cmfastl780003mn08r5k4npbw	cmfastl6q0001mn08c4vdyccr	cmf9so1190007mn08np3y7fk0	1	94	94	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	กล่อง(4)
cmfastl7l0007mn08y2wjqc06	cmfastl6q0001mn08c4vdyccr	cmf9so1140005mn081rcnye8n	1	29	29	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	ซอง
\.


--
-- TOC entry 3552 (class 0 OID 27530)
-- Dependencies: 217
-- Data for Name: Patient; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Patient" (id, first_name, last_name, date_of_birth, gender, phone, email, address, photo_url, photo_path, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3557 (class 0 OID 27579)
-- Dependencies: 222
-- Data for Name: Payment; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Payment" (id, "orderId", payment_type, amount, payment_date, details) FROM stdin;
cmfastl8d000bmn083p80qsa4	cmfastl6q0001mn08c4vdyccr	cash	123	2025-09-08 07:26:56.702	ชำระด้วยเงินสด รับเงิน ฿123.00 เงินทอน ฿0.00
\.


--
-- TOC entry 3565 (class 0 OID 27649)
-- Dependencies: 230
-- Data for Name: Prescription; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Prescription" (id, "medicalRecordId", "productId", dosage, dosage_unit, times_per_day, duration_days, instructions, product_name, product_unit) FROM stdin;
\.


--
-- TOC entry 3554 (class 0 OID 27548)
-- Dependencies: 219
-- Data for Name: Product; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Product" (id, product_name, product_type, generic_name, short_name, status, vat_percent, expiration_warning_date, sale_price, unit, pack_size, reorder_point, cost, sku, barcode, stock_quantity, volume, volume_unit, shelf_code, shelf_row, "categoryId", symptom_category, license_number, dosage_unit, dosage, times_per_day, interval_hours, before_meal, after_meal, after_meal_immediate, morning, noon, evening, before_bed, properties, usage_instruction, sale_note, purchase_note, image_url, image_path, "isDelete", created_at, updated_at) FROM stdin;
cmf9so11h000dmn08695w6qbm	ยาแก้อักเสบ ยี่ห้อ XXXX	ยารักษาโรค	ยาแก้อักเสบ ยาต้านการอักเสบ	ยี่ห้อ XXXX	active	0	\N	18	แผง	1	\N	2.8	SKU0011206	\N	1000	\N	\N	\N	\N	cmf9sjqlk000bmnc0r22c0s8x	ระบบประสาท,กระดูก กล้ามเนื้อ และข้อ,ระบบทางเดินหายใจ,อื่นๆ ที่เป็นยา	report9,report10,report11	เม็ด	1	4	4	t	\N	\N	1	1	1	1	ออกฤทธิ์ลดการอักเสบ ลดไข้ บรรเทาปวด ลดบวมแดง	ทานทุก ๆ 4 ชั่วโมง ครั้งละ 1 เม็ด หลังอาหาร เช้า กลางวัน เย็น และก่อนนอน	ไม่จำหน่ายให้เด็กอายุต่ำกว่า 18 ปี และผู้หญิงตั้งครรภ์	ตรวจสอบวันผลิตก่อนรับสินค้าทุกครั้ง	\N	\N	f	2025-09-07 14:34:51.077	2025-09-07 14:34:51.077
cmf9so11f000bmn08u3kq4ej4	ซาร่า ยาเม็ดบรรเทาปวด ลดไข้ พาราเซตามอล 500mg	ยารักษาโรค	Paracetamol	Sara ซาร่า 500mg	active	0	90	180	กล่อง	20	0	0	SKU0011205		0	0	mg			cmf9sjqln000dmnc00wl7rikm	ระบบประสาท,กระดูก กล้ามเนื้อ และข้อ	report9	เม็ด	1	\N	4	f	f	f					ยาเม็ดบรรเทาปวด ลดไข้	เฉพาะเวลาปวด หรือมีไข้	ตรวจสอบวันหมดอายุก่อนจำหน่ายให้กับลูกค้า	ตรวจสอบวันผลิตก่อนรับสินค้าทุกครั้ง	/upload/image/products/2f77e6ef-507d-45e7-91f3-9be1d5ae08aa.jpg	\N	f	2025-09-07 14:34:51.075	2025-09-07 19:31:26.417
cmf9so10x0003mn08gcez1hn6	3M Futuro Ankle Size M	อุปกรณ์ทางการแพทย์	อุปกรณ์พยุงข้อเท้าชนิดสวม	FUTURO Size M	active	0	\N	290	BX	1	0	0	SKU0011201	=0072140478759	100	0	mg			cmf9sjql40001mnc06m6kqsod	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ช่วยพยุงข้อเท้าที่บาดเจ็บหรืออ่อนแอ	สวมใส่สะดวก จึงสามารถสวมรองเท้าได้โดยไม่ต้องเปลี่ยนไซส์ สามารถใช้ได้ทั้งด้านซ้ายและขวา	ตรวจสอบบรรจุภัณฑ์ก่อนจำหน่ายให้กับลูกค้า	ขั้นต่ำสำหรับการสั่งซื้อ 100 โหล	/upload/image/products/964f751f-d329-4aaa-beed-e656dcd479ba.jpg	\N	f	2025-09-07 14:34:51.056	2025-09-07 19:39:53.348
cmf9so11c0009mn082wcpglee	ซาร่า ยาเม็ดบรรเทาปวด ลดไข้ พาราเซตามอล 500mg	ยารักษาโรค	Paracetamol	Sara ซาร่า 500mg	active	0	90	9	แผง	1	0	0	SKU0011204	=8851473004000	0	0	mg			cmf9sjqln000dmnc00wl7rikm	ระบบประสาท,กระดูก กล้ามเนื้อ และข้อ	report9	เม็ด	1	\N	4	f	f	f					ยาเม็ดบรรเทาปวด ลดไข้	เฉพาะเวลาปวด หรือมีไข้	ตรวจสอบวันหมดอายุก่อนจำหน่ายให้กับลูกค้า	ตรวจสอบวันผลิตก่อนรับสินค้าทุกครั้ง	/upload/image/products/9c24ae7b-3078-48e4-985c-43bb365db967.jpg	\N	f	2025-09-07 14:34:51.071	2025-09-07 19:20:15.939
cmf9so1190007mn08np3y7fk0	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	ผลิตภัณฑ์เสริมอาหาร	Gaviscon	Gaviscon กาวิสคอน	active	0	\N	94	กล่อง(4)	4	\N	\N	SKU0011203	\N	99	10	mg	หลังร้าน	12	cmf9sjqln000dmnc00wl7rikm	ระบบทางเดินอาหาร	report9	ซอง	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	ช่วยบรรเทาอาการแสบร้อนกลางอกจากโรคกรดไหลย้อน และอาหารไม่ย่อยเนื่องจากมีกรดมากเกินไปในกระเพาะอาหาร	รับประทานหลังอาหาร และก่อนนอน	ตรวจสอบวันหมดอายุก่อนจำหน่ายให้กับลูกค้า	ตรวจสอบวันผลิตก่อนรับสินค้าทุกครั้ง	\N	\N	f	2025-09-07 14:34:51.068	2025-09-08 07:26:56.665
cmf9so1140005mn081rcnye8n	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	ผลิตภัณฑ์เสริมอาหาร	Gaviscon	Gaviscon กาวิสคอน	active	0	\N	29	ซอง	1	\N	\N	SKU0011202	=8850360032249	99	10	mg	หน้าร้าน	8	cmf9sjqln000dmnc00wl7rikm	ระบบทางเดินอาหาร	report9	ซอง	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	ช่วยบรรเทาอาการแสบร้อนกลางอกจากโรคกรดไหลย้อน และอาหารไม่ย่อยเนื่องจากมีกรดมากเกินไปในกระเพาะอาหาร	รับประทานหลังอาหาร และก่อนนอน	ตรวจสอบวันหมดอายุก่อนจำหน่ายให้กับลูกค้า	ตรวจสอบวันผลิตก่อนรับสินค้าทุกครั้ง	\N	\N	f	2025-09-07 14:34:51.063	2025-09-08 07:26:56.675
\.


--
-- TOC entry 3560 (class 0 OID 27604)
-- Dependencies: 225
-- Data for Name: Purchase; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Purchase" (id, "supplierId", "userId", purchase_date, total_amount, status, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3561 (class 0 OID 27615)
-- Dependencies: 226
-- Data for Name: PurchaseItem; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."PurchaseItem" (id, "purchaseId", "productId", quantity, unit_cost, total_cost, product_name, product_unit) FROM stdin;
\.


--
-- TOC entry 3569 (class 0 OID 27682)
-- Dependencies: 234
-- Data for Name: SalesReport; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."SalesReport" (id, report_date, "productId", quantity_sold, total_sales, created_at, "createdByUserId", created_by_username, product_name, product_unit) FROM stdin;
\.


--
-- TOC entry 3570 (class 0 OID 27690)
-- Dependencies: 235
-- Data for Name: Session; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Session" (id, "sessionToken", "userId", expires) FROM stdin;
cmfav8w5o0001nw08o4krjsxe	adb7ffc861037fac88e9a03099d4e322	cmf9sjql10000mnc0uzibmwy5	2025-09-09 08:34:49.93
\.


--
-- TOC entry 3568 (class 0 OID 27673)
-- Dependencies: 233
-- Data for Name: StockAlert; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."StockAlert" (id, "productId", alert_type, alert_message, created_at, "createdByUserId", created_by_username, acknowledged, acknowledged_at, product_name, product_unit) FROM stdin;
\.


--
-- TOC entry 3562 (class 0 OID 27622)
-- Dependencies: 227
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."StockMovement" (id, "productId", movement_type, quantity, reference_table, reference_id, note, created_at, "createdByUserId", created_by_username, product_name, product_unit) FROM stdin;
cmfastl7g0005mn088fp14ubq	cmf9so1190007mn08np3y7fk0	out	1	order	cmfastl6q0001mn08c4vdyccr	Sale - Order cmfastl6q0001mn08c4vdyccr	2025-09-08 07:26:56.669	cmf9sjql10000mnc0uzibmwy5	admin	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	กล่อง(4)
cmfastl7p0009mn08atjzwibd	cmf9so1140005mn081rcnye8n	out	1	order	cmfastl6q0001mn08c4vdyccr	Sale - Order cmfastl6q0001mn08c4vdyccr	2025-09-08 07:26:56.678	cmf9sjql10000mnc0uzibmwy5	admin	Gaviscon Suspension รสเปปเปอร์มินต์ ขนาด 10 มล.	ซอง
\.


--
-- TOC entry 3559 (class 0 OID 27595)
-- Dependencies: 224
-- Data for Name: Supplier; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."Supplier" (id, name, contact_name, phone, email, address, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3566 (class 0 OID 27656)
-- Dependencies: 231
-- Data for Name: TreatmentPlan; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."TreatmentPlan" (id, "patientId", "doctorId", plan_details, start_date, end_date, "isDelete", created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3551 (class 0 OID 27520)
-- Dependencies: 216
-- Data for Name: User; Type: TABLE DATA; Schema: clinic_dev; Owner: -
--

COPY clinic_dev."User" (id, role, email, username, password_hash, status, avatar_url, avatar_path, "isDelete", created_at, updated_at) FROM stdin;
cmf9sjql10000mnc0uzibmwy5	admin	admin@clinic.system	admin	$2b$10$TY3FjUJzFcU0v8zdlCOYvuluqoSaG9.9wk8v3DK6HNv2rgqGC19.2	active	\N	\N	f	2025-09-07 14:31:30.901	2025-09-08 08:34:49.928
\.


--
-- TOC entry 3380 (class 2606 OID 27703)
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- TOC entry 3363 (class 2606 OID 27639)
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3329 (class 2606 OID 27547)
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- TOC entry 3371 (class 2606 OID 27672)
-- Name: DailyReport DailyReport_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."DailyReport"
    ADD CONSTRAINT "DailyReport_pkey" PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 27594)
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- TOC entry 3365 (class 2606 OID 27648)
-- Name: MedicalRecord MedicalRecord_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY (id);


--
-- TOC entry 3346 (class 2606 OID 27578)
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3344 (class 2606 OID 27571)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- TOC entry 3325 (class 2606 OID 27538)
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- TOC entry 3348 (class 2606 OID 27586)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3367 (class 2606 OID 27655)
-- Name: Prescription Prescription_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY (id);


--
-- TOC entry 3335 (class 2606 OID 27559)
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 3359 (class 2606 OID 27621)
-- Name: PurchaseItem PurchaseItem_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3357 (class 2606 OID 27614)
-- Name: Purchase Purchase_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Purchase"
    ADD CONSTRAINT "Purchase_pkey" PRIMARY KEY (id);


--
-- TOC entry 3375 (class 2606 OID 27689)
-- Name: SalesReport SalesReport_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."SalesReport"
    ADD CONSTRAINT "SalesReport_pkey" PRIMARY KEY (id);


--
-- TOC entry 3377 (class 2606 OID 27696)
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- TOC entry 3373 (class 2606 OID 27681)
-- Name: StockAlert StockAlert_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."StockAlert"
    ADD CONSTRAINT "StockAlert_pkey" PRIMARY KEY (id);


--
-- TOC entry 3361 (class 2606 OID 27629)
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- TOC entry 3355 (class 2606 OID 27603)
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- TOC entry 3369 (class 2606 OID 27664)
-- Name: TreatmentPlan TreatmentPlan_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."TreatmentPlan"
    ADD CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY (id);


--
-- TOC entry 3322 (class 2606 OID 27529)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3381 (class 1259 OID 27723)
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON clinic_dev."Account" USING btree (provider, "providerAccountId");


--
-- TOC entry 3326 (class 1259 OID 27707)
-- Name: Category_code_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Category_code_key" ON clinic_dev."Category" USING btree (code);


--
-- TOC entry 3327 (class 1259 OID 27706)
-- Name: Category_name_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Category_name_key" ON clinic_dev."Category" USING btree (name);


--
-- TOC entry 3349 (class 1259 OID 27721)
-- Name: Invoice_invoice_number_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON clinic_dev."Invoice" USING btree (invoice_number);


--
-- TOC entry 3350 (class 1259 OID 27719)
-- Name: Invoice_orderId_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Invoice_orderId_key" ON clinic_dev."Invoice" USING btree ("orderId");


--
-- TOC entry 3351 (class 1259 OID 27720)
-- Name: Invoice_paymentId_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Invoice_paymentId_key" ON clinic_dev."Invoice" USING btree ("paymentId");


--
-- TOC entry 3330 (class 1259 OID 27709)
-- Name: Product_barcode_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Product_barcode_key" ON clinic_dev."Product" USING btree (barcode);


--
-- TOC entry 3331 (class 1259 OID 27711)
-- Name: Product_categoryId_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_categoryId_idx" ON clinic_dev."Product" USING btree ("categoryId");


--
-- TOC entry 3332 (class 1259 OID 27713)
-- Name: Product_created_at_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_created_at_idx" ON clinic_dev."Product" USING btree (created_at);


--
-- TOC entry 3333 (class 1259 OID 27715)
-- Name: Product_isDelete_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_isDelete_idx" ON clinic_dev."Product" USING btree ("isDelete");


--
-- TOC entry 3336 (class 1259 OID 27714)
-- Name: Product_product_name_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_product_name_idx" ON clinic_dev."Product" USING btree (product_name);


--
-- TOC entry 3337 (class 1259 OID 27712)
-- Name: Product_product_type_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_product_type_idx" ON clinic_dev."Product" USING btree (product_type);


--
-- TOC entry 3338 (class 1259 OID 27708)
-- Name: Product_sku_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Product_sku_key" ON clinic_dev."Product" USING btree (sku);


--
-- TOC entry 3339 (class 1259 OID 27716)
-- Name: Product_status_categoryId_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_status_categoryId_idx" ON clinic_dev."Product" USING btree (status, "categoryId");


--
-- TOC entry 3340 (class 1259 OID 27710)
-- Name: Product_status_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_status_idx" ON clinic_dev."Product" USING btree (status);


--
-- TOC entry 3341 (class 1259 OID 27718)
-- Name: Product_status_isDelete_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_status_isDelete_idx" ON clinic_dev."Product" USING btree (status, "isDelete");


--
-- TOC entry 3342 (class 1259 OID 27717)
-- Name: Product_status_product_type_idx; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE INDEX "Product_status_product_type_idx" ON clinic_dev."Product" USING btree (status, product_type);


--
-- TOC entry 3378 (class 1259 OID 27722)
-- Name: Session_sessionToken_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON clinic_dev."Session" USING btree ("sessionToken");


--
-- TOC entry 3320 (class 1259 OID 27704)
-- Name: User_email_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON clinic_dev."User" USING btree (email);


--
-- TOC entry 3323 (class 1259 OID 27705)
-- Name: User_username_key; Type: INDEX; Schema: clinic_dev; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON clinic_dev."User" USING btree (username);


--
-- TOC entry 3407 (class 2606 OID 27849)
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3395 (class 2606 OID 27794)
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3396 (class 2606 OID 27789)
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES clinic_dev."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3388 (class 2606 OID 27754)
-- Name: Invoice Invoice_orderId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Invoice"
    ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES clinic_dev."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3389 (class 2606 OID 27759)
-- Name: Invoice Invoice_paymentId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Invoice"
    ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES clinic_dev."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3397 (class 2606 OID 27809)
-- Name: MedicalRecord MedicalRecord_appointmentId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES clinic_dev."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3398 (class 2606 OID 27804)
-- Name: MedicalRecord MedicalRecord_doctorId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3399 (class 2606 OID 27799)
-- Name: MedicalRecord MedicalRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES clinic_dev."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3385 (class 2606 OID 27739)
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES clinic_dev."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3386 (class 2606 OID 27744)
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3383 (class 2606 OID 27734)
-- Name: Order Order_patientId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Order"
    ADD CONSTRAINT "Order_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES clinic_dev."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3384 (class 2606 OID 27729)
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3387 (class 2606 OID 27749)
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES clinic_dev."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3400 (class 2606 OID 27814)
-- Name: Prescription Prescription_medicalRecordId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Prescription"
    ADD CONSTRAINT "Prescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES clinic_dev."MedicalRecord"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3401 (class 2606 OID 27819)
-- Name: Prescription Prescription_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Prescription"
    ADD CONSTRAINT "Prescription_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3382 (class 2606 OID 27724)
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES clinic_dev."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3392 (class 2606 OID 27779)
-- Name: PurchaseItem PurchaseItem_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3393 (class 2606 OID 27774)
-- Name: PurchaseItem PurchaseItem_purchaseId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES clinic_dev."Purchase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3390 (class 2606 OID 27764)
-- Name: Purchase Purchase_supplierId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Purchase"
    ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES clinic_dev."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3391 (class 2606 OID 27769)
-- Name: Purchase Purchase_userId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Purchase"
    ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3405 (class 2606 OID 27839)
-- Name: SalesReport SalesReport_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."SalesReport"
    ADD CONSTRAINT "SalesReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3406 (class 2606 OID 27844)
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3404 (class 2606 OID 27834)
-- Name: StockAlert StockAlert_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."StockAlert"
    ADD CONSTRAINT "StockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3394 (class 2606 OID 27784)
-- Name: StockMovement StockMovement_productId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."StockMovement"
    ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES clinic_dev."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3402 (class 2606 OID 27829)
-- Name: TreatmentPlan TreatmentPlan_doctorId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."TreatmentPlan"
    ADD CONSTRAINT "TreatmentPlan_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES clinic_dev."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3403 (class 2606 OID 27824)
-- Name: TreatmentPlan TreatmentPlan_patientId_fkey; Type: FK CONSTRAINT; Schema: clinic_dev; Owner: -
--

ALTER TABLE ONLY clinic_dev."TreatmentPlan"
    ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES clinic_dev."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-09-08 16:06:09 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict gQjhR345K9GKaxVXtFWVjH2hWoO7M2VsEpfv12RXQA9CC0Lu4VBZRTfB9uYfgNg

