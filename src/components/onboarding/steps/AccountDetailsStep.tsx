import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import Select, { StylesConfig } from "react-select";
import { OnboardingData } from "../../../services/onboarding";
import { AuthHeading } from "@/components/auth/AuthShell";
import { AUTH_SECONDARY_CLASS, AUTH_SUBMIT_CLASS } from "@/components/auth/authStyles";

interface SelectOption {
  value: string;
  label: string;
}

interface AccountDetailsStepProps {
  nextStep: (data?: Partial<OnboardingData>) => void;
  prevStep: () => void;
  initialData?: OnboardingData;
}

// ── Países — todos los del mundo (nombre en inglés para la API, label en español) ─
const COUNTRIES = [
  { code: "AF", name: "Afghanistan", label: "🇦🇫 Afganistán", dial: "+93" },
  { code: "AL", name: "Albania", label: "🇦🇱 Albania", dial: "+355" },
  { code: "DE", name: "Germany", label: "🇩🇪 Alemania", dial: "+49" },
  { code: "AD", name: "Andorra", label: "🇦🇩 Andorra", dial: "+376" },
  { code: "AO", name: "Angola", label: "🇦🇴 Angola", dial: "+244" },
  { code: "AG", name: "Antigua and Barbuda", label: "🇦🇬 Antigua y Barbuda", dial: "+1" },
  { code: "SA", name: "Saudi Arabia", label: "🇸🇦 Arabia Saudita", dial: "+966" },
  { code: "DZ", name: "Algeria", label: "🇩🇿 Argelia", dial: "+213" },
  { code: "AR", name: "Argentina", label: "🇦🇷 Argentina", dial: "+54" },
  { code: "AM", name: "Armenia", label: "🇦🇲 Armenia", dial: "+374" },
  { code: "AU", name: "Australia", label: "🇦🇺 Australia", dial: "+61" },
  { code: "AT", name: "Austria", label: "🇦🇹 Austria", dial: "+43" },
  { code: "AZ", name: "Azerbaijan", label: "🇦🇿 Azerbaiyán", dial: "+994" },
  { code: "BS", name: "Bahamas", label: "🇧🇸 Bahamas", dial: "+1" },
  { code: "BH", name: "Bahrain", label: "🇧🇭 Baréin", dial: "+973" },
  { code: "BD", name: "Bangladesh", label: "🇧🇩 Bangladés", dial: "+880" },
  { code: "BB", name: "Barbados", label: "🇧🇧 Barbados", dial: "+1" },
  { code: "BE", name: "Belgium", label: "🇧🇪 Bélgica", dial: "+32" },
  { code: "BZ", name: "Belize", label: "🇧🇿 Belice", dial: "+501" },
  { code: "BJ", name: "Benin", label: "🇧🇯 Benín", dial: "+229" },
  { code: "BY", name: "Belarus", label: "🇧🇾 Bielorrusia", dial: "+375" },
  { code: "MM", name: "Myanmar", label: "🇲🇲 Birmania", dial: "+95" },
  { code: "BO", name: "Bolivia", label: "🇧🇴 Bolivia", dial: "+591" },
  { code: "BA", name: "Bosnia and Herzegovina", label: "🇧🇦 Bosnia y Herzegovina", dial: "+387" },
  { code: "BW", name: "Botswana", label: "🇧🇼 Botsuana", dial: "+267" },
  { code: "BR", name: "Brazil", label: "🇧🇷 Brasil", dial: "+55" },
  { code: "BN", name: "Brunei", label: "🇧🇳 Brunéi", dial: "+673" },
  { code: "BG", name: "Bulgaria", label: "🇧🇬 Bulgaria", dial: "+359" },
  { code: "BF", name: "Burkina Faso", label: "🇧🇫 Burkina Faso", dial: "+226" },
  { code: "BI", name: "Burundi", label: "🇧🇮 Burundi", dial: "+257" },
  { code: "BT", name: "Bhutan", label: "🇧🇹 Bután", dial: "+975" },
  { code: "CV", name: "Cape Verde", label: "🇨🇻 Cabo Verde", dial: "+238" },
  { code: "KH", name: "Cambodia", label: "🇰🇭 Camboya", dial: "+855" },
  { code: "CM", name: "Cameroon", label: "🇨🇲 Camerún", dial: "+237" },
  { code: "CA", name: "Canada", label: "🇨🇦 Canadá", dial: "+1" },
  { code: "QA", name: "Qatar", label: "🇶🇦 Catar", dial: "+974" },
  { code: "TD", name: "Chad", label: "🇹🇩 Chad", dial: "+235" },
  { code: "CL", name: "Chile", label: "🇨🇱 Chile", dial: "+56" },
  { code: "CN", name: "China", label: "🇨🇳 China", dial: "+86" },
  { code: "CY", name: "Cyprus", label: "🇨🇾 Chipre", dial: "+357" },
  { code: "VA", name: "Vatican City", label: "🇻🇦 Ciudad del Vaticano", dial: "+379" },
  { code: "CO", name: "Colombia", label: "🇨🇴 Colombia", dial: "+57" },
  { code: "KM", name: "Comoros", label: "🇰🇲 Comoras", dial: "+269" },
  { code: "CG", name: "Republic of the Congo", label: "🇨🇬 Congo (Rep.)", dial: "+242" },
  { code: "CD", name: "Democratic Republic of the Congo", label: "🇨🇩 Congo (RD)", dial: "+243" },
  { code: "KP", name: "North Korea", label: "🇰🇵 Corea del Norte", dial: "+850" },
  { code: "KR", name: "South Korea", label: "🇰🇷 Corea del Sur", dial: "+82" },
  { code: "CR", name: "Costa Rica", label: "🇨🇷 Costa Rica", dial: "+506" },
  { code: "CI", name: "Ivory Coast", label: "🇨🇮 Costa de Marfil", dial: "+225" },
  { code: "HR", name: "Croatia", label: "🇭🇷 Croacia", dial: "+385" },
  { code: "CU", name: "Cuba", label: "🇨🇺 Cuba", dial: "+53" },
  { code: "DK", name: "Denmark", label: "🇩🇰 Dinamarca", dial: "+45" },
  { code: "DJ", name: "Djibouti", label: "🇩🇯 Yibuti", dial: "+253" },
  { code: "DM", name: "Dominica", label: "🇩🇲 Dominica", dial: "+1" },
  { code: "EC", name: "Ecuador", label: "🇪🇨 Ecuador", dial: "+593" },
  { code: "EG", name: "Egypt", label: "🇪🇬 Egipto", dial: "+20" },
  { code: "SV", name: "El Salvador", label: "🇸🇻 El Salvador", dial: "+503" },
  { code: "AE", name: "United Arab Emirates", label: "🇦🇪 Emiratos Árabes Unidos", dial: "+971" },
  { code: "ER", name: "Eritrea", label: "🇪🇷 Eritrea", dial: "+291" },
  { code: "SK", name: "Slovakia", label: "🇸🇰 Eslovaquia", dial: "+421" },
  { code: "SI", name: "Slovenia", label: "🇸🇮 Eslovenia", dial: "+386" },
  { code: "ES", name: "Spain", label: "🇪🇸 España", dial: "+34" },
  { code: "US", name: "United States", label: "🇺🇸 Estados Unidos", dial: "+1" },
  { code: "EE", name: "Estonia", label: "🇪🇪 Estonia", dial: "+372" },
  { code: "SZ", name: "Eswatini", label: "🇸🇿 Esuatini", dial: "+268" },
  { code: "ET", name: "Ethiopia", label: "🇪🇹 Etiopía", dial: "+251" },
  { code: "FJ", name: "Fiji", label: "🇫🇯 Fiyi", dial: "+679" },
  { code: "PH", name: "Philippines", label: "🇵🇭 Filipinas", dial: "+63" },
  { code: "FI", name: "Finland", label: "🇫🇮 Finlandia", dial: "+358" },
  { code: "FR", name: "France", label: "🇫🇷 Francia", dial: "+33" },
  { code: "GA", name: "Gabon", label: "🇬🇦 Gabón", dial: "+241" },
  { code: "GM", name: "Gambia", label: "🇬🇲 Gambia", dial: "+220" },
  { code: "GE", name: "Georgia", label: "🇬🇪 Georgia", dial: "+995" },
  { code: "GH", name: "Ghana", label: "🇬🇭 Ghana", dial: "+233" },
  { code: "GD", name: "Grenada", label: "🇬🇩 Granada", dial: "+1" },
  { code: "GR", name: "Greece", label: "🇬🇷 Grecia", dial: "+30" },
  { code: "GT", name: "Guatemala", label: "🇬🇹 Guatemala", dial: "+502" },
  { code: "GN", name: "Guinea", label: "🇬🇳 Guinea", dial: "+224" },
  { code: "GQ", name: "Equatorial Guinea", label: "🇬🇶 Guinea Ecuatorial", dial: "+240" },
  { code: "GW", name: "Guinea-Bissau", label: "🇬🇼 Guinea-Bisáu", dial: "+245" },
  { code: "GY", name: "Guyana", label: "🇬🇾 Guyana", dial: "+592" },
  { code: "HT", name: "Haiti", label: "🇭🇹 Haití", dial: "+509" },
  { code: "HN", name: "Honduras", label: "🇭🇳 Honduras", dial: "+504" },
  { code: "HU", name: "Hungary", label: "🇭🇺 Hungría", dial: "+36" },
  { code: "IN", name: "India", label: "🇮🇳 India", dial: "+91" },
  { code: "ID", name: "Indonesia", label: "🇮🇩 Indonesia", dial: "+62" },
  { code: "IQ", name: "Iraq", label: "🇮🇶 Irak", dial: "+964" },
  { code: "IR", name: "Iran", label: "🇮🇷 Irán", dial: "+98" },
  { code: "IE", name: "Ireland", label: "🇮🇪 Irlanda", dial: "+353" },
  { code: "IS", name: "Iceland", label: "🇮🇸 Islandia", dial: "+354" },
  { code: "MH", name: "Marshall Islands", label: "🇲🇭 Islas Marshall", dial: "+692" },
  { code: "SB", name: "Solomon Islands", label: "🇸🇧 Islas Salomón", dial: "+677" },
  { code: "IL", name: "Israel", label: "🇮🇱 Israel", dial: "+972" },
  { code: "IT", name: "Italy", label: "🇮🇹 Italia", dial: "+39" },
  { code: "JM", name: "Jamaica", label: "🇯🇲 Jamaica", dial: "+1" },
  { code: "JP", name: "Japan", label: "🇯🇵 Japón", dial: "+81" },
  { code: "JO", name: "Jordan", label: "🇯🇴 Jordania", dial: "+962" },
  { code: "KZ", name: "Kazakhstan", label: "🇰🇿 Kazajistán", dial: "+7" },
  { code: "KE", name: "Kenya", label: "🇰🇪 Kenia", dial: "+254" },
  { code: "KG", name: "Kyrgyzstan", label: "🇰🇬 Kirguistán", dial: "+996" },
  { code: "KI", name: "Kiribati", label: "🇰🇮 Kiribati", dial: "+686" },
  { code: "KW", name: "Kuwait", label: "🇰🇼 Kuwait", dial: "+965" },
  { code: "LA", name: "Laos", label: "🇱🇦 Laos", dial: "+856" },
  { code: "LS", name: "Lesotho", label: "🇱🇸 Lesoto", dial: "+266" },
  { code: "LV", name: "Latvia", label: "🇱🇻 Letonia", dial: "+371" },
  { code: "LB", name: "Lebanon", label: "🇱🇧 Líbano", dial: "+961" },
  { code: "LR", name: "Liberia", label: "🇱🇷 Liberia", dial: "+231" },
  { code: "LY", name: "Libya", label: "🇱🇾 Libia", dial: "+218" },
  { code: "LI", name: "Liechtenstein", label: "🇱🇮 Liechtenstein", dial: "+423" },
  { code: "LT", name: "Lithuania", label: "🇱🇹 Lituania", dial: "+370" },
  { code: "LU", name: "Luxembourg", label: "🇱🇺 Luxemburgo", dial: "+352" },
  { code: "MG", name: "Madagascar", label: "🇲🇬 Madagascar", dial: "+261" },
  { code: "MY", name: "Malaysia", label: "🇲🇾 Malasia", dial: "+60" },
  { code: "MW", name: "Malawi", label: "🇲🇼 Malaui", dial: "+265" },
  { code: "MV", name: "Maldives", label: "🇲🇻 Maldivas", dial: "+960" },
  { code: "ML", name: "Mali", label: "🇲🇱 Mali", dial: "+223" },
  { code: "MT", name: "Malta", label: "🇲🇹 Malta", dial: "+356" },
  { code: "MA", name: "Morocco", label: "🇲🇦 Marruecos", dial: "+212" },
  { code: "MU", name: "Mauritius", label: "🇲🇺 Mauricio", dial: "+230" },
  { code: "MR", name: "Mauritania", label: "🇲🇷 Mauritania", dial: "+222" },
  { code: "MX", name: "Mexico", label: "🇲🇽 México", dial: "+52" },
  { code: "FM", name: "Micronesia", label: "🇫🇲 Micronesia", dial: "+691" },
  { code: "MD", name: "Moldova", label: "🇲🇩 Moldavia", dial: "+373" },
  { code: "MC", name: "Monaco", label: "🇲🇨 Mónaco", dial: "+377" },
  { code: "MN", name: "Mongolia", label: "🇲🇳 Mongolia", dial: "+976" },
  { code: "ME", name: "Montenegro", label: "🇲🇪 Montenegro", dial: "+382" },
  { code: "MZ", name: "Mozambique", label: "🇲🇿 Mozambique", dial: "+258" },
  { code: "NA", name: "Namibia", label: "🇳🇦 Namibia", dial: "+264" },
  { code: "NR", name: "Nauru", label: "🇳🇷 Nauru", dial: "+674" },
  { code: "NP", name: "Nepal", label: "🇳🇵 Nepal", dial: "+977" },
  { code: "NI", name: "Nicaragua", label: "🇳🇮 Nicaragua", dial: "+505" },
  { code: "NE", name: "Niger", label: "🇳🇪 Níger", dial: "+227" },
  { code: "NG", name: "Nigeria", label: "🇳🇬 Nigeria", dial: "+234" },
  { code: "NO", name: "Norway", label: "🇳🇴 Noruega", dial: "+47" },
  { code: "NZ", name: "New Zealand", label: "🇳🇿 Nueva Zelanda", dial: "+64" },
  { code: "OM", name: "Oman", label: "🇴🇲 Omán", dial: "+968" },
  { code: "NL", name: "Netherlands", label: "🇳🇱 Países Bajos", dial: "+31" },
  { code: "PK", name: "Pakistan", label: "🇵🇰 Pakistán", dial: "+92" },
  { code: "PW", name: "Palau", label: "🇵🇼 Palaos", dial: "+680" },
  { code: "PA", name: "Panama", label: "🇵🇦 Panamá", dial: "+507" },
  { code: "PG", name: "Papua New Guinea", label: "🇵🇬 Papúa Nueva Guinea", dial: "+675" },
  { code: "PY", name: "Paraguay", label: "🇵🇾 Paraguay", dial: "+595" },
  { code: "PE", name: "Peru", label: "🇵🇪 Perú", dial: "+51" },
  { code: "PL", name: "Poland", label: "🇵🇱 Polonia", dial: "+48" },
  { code: "PT", name: "Portugal", label: "🇵🇹 Portugal", dial: "+351" },
  { code: "DO", name: "Dominican Republic", label: "🇩🇴 República Dominicana", dial: "+1" },
  { code: "CZ", name: "Czech Republic", label: "🇨🇿 República Checa", dial: "+420" },
  { code: "RW", name: "Rwanda", label: "🇷🇼 Ruanda", dial: "+250" },
  { code: "RO", name: "Romania", label: "🇷🇴 Rumanía", dial: "+40" },
  { code: "RU", name: "Russia", label: "🇷🇺 Rusia", dial: "+7" },
  { code: "WS", name: "Samoa", label: "🇼🇸 Samoa", dial: "+685" },
  { code: "KN", name: "Saint Kitts and Nevis", label: "🇰🇳 San Cristóbal y Nieves", dial: "+1" },
  { code: "SM", name: "San Marino", label: "🇸🇲 San Marino", dial: "+378" },
  {
    code: "VC",
    name: "Saint Vincent and the Grenadines",
    label: "🇻🇨 San Vicente y las Granadinas",
    dial: "+1",
  },
  { code: "LC", name: "Saint Lucia", label: "🇱🇨 Santa Lucía", dial: "+1" },
  { code: "ST", name: "Sao Tome and Principe", label: "🇸🇹 Santo Tomé y Príncipe", dial: "+239" },
  { code: "SN", name: "Senegal", label: "🇸🇳 Senegal", dial: "+221" },
  { code: "RS", name: "Serbia", label: "🇷🇸 Serbia", dial: "+381" },
  { code: "SC", name: "Seychelles", label: "🇸🇨 Seychelles", dial: "+248" },
  { code: "SL", name: "Sierra Leone", label: "🇸🇱 Sierra Leona", dial: "+232" },
  { code: "SG", name: "Singapore", label: "🇸🇬 Singapur", dial: "+65" },
  { code: "SY", name: "Syria", label: "🇸🇾 Siria", dial: "+963" },
  { code: "SO", name: "Somalia", label: "🇸🇴 Somalia", dial: "+252" },
  { code: "LK", name: "Sri Lanka", label: "🇱🇰 Sri Lanka", dial: "+94" },
  { code: "ZA", name: "South Africa", label: "🇿🇦 Sudáfrica", dial: "+27" },
  { code: "SD", name: "Sudan", label: "🇸🇩 Sudán", dial: "+249" },
  { code: "SS", name: "South Sudan", label: "🇸🇸 Sudán del Sur", dial: "+211" },
  { code: "SE", name: "Sweden", label: "🇸🇪 Suecia", dial: "+46" },
  { code: "CH", name: "Switzerland", label: "🇨🇭 Suiza", dial: "+41" },
  { code: "SR", name: "Suriname", label: "🇸🇷 Surinam", dial: "+597" },
  { code: "TH", name: "Thailand", label: "🇹🇭 Tailandia", dial: "+66" },
  { code: "TZ", name: "Tanzania", label: "🇹🇿 Tanzania", dial: "+255" },
  { code: "TJ", name: "Tajikistan", label: "🇹🇯 Tayikistán", dial: "+992" },
  { code: "TL", name: "Timor-Leste", label: "🇹🇱 Timor Oriental", dial: "+670" },
  { code: "TG", name: "Togo", label: "🇹🇬 Togo", dial: "+228" },
  { code: "TO", name: "Tonga", label: "🇹🇴 Tonga", dial: "+676" },
  { code: "TT", name: "Trinidad and Tobago", label: "🇹🇹 Trinidad y Tobago", dial: "+1" },
  { code: "TN", name: "Tunisia", label: "🇹🇳 Túnez", dial: "+216" },
  { code: "TM", name: "Turkmenistan", label: "🇹🇲 Turkmenistán", dial: "+993" },
  { code: "TR", name: "Turkey", label: "🇹🇷 Turquía", dial: "+90" },
  { code: "TV", name: "Tuvalu", label: "🇹🇻 Tuvalu", dial: "+688" },
  { code: "UA", name: "Ukraine", label: "🇺🇦 Ucrania", dial: "+380" },
  { code: "UG", name: "Uganda", label: "🇺🇬 Uganda", dial: "+256" },
  { code: "UY", name: "Uruguay", label: "🇺🇾 Uruguay", dial: "+598" },
  { code: "UZ", name: "Uzbekistan", label: "🇺🇿 Uzbekistán", dial: "+998" },
  { code: "VU", name: "Vanuatu", label: "🇻🇺 Vanuatu", dial: "+678" },
  { code: "VE", name: "Venezuela", label: "🇻🇪 Venezuela", dial: "+58" },
  { code: "VN", name: "Vietnam", label: "🇻🇳 Vietnam", dial: "+84" },
  { code: "YE", name: "Yemen", label: "🇾🇪 Yemen", dial: "+967" },
  { code: "ZM", name: "Zambia", label: "🇿🇲 Zambia", dial: "+260" },
  { code: "ZW", name: "Zimbabwe", label: "🇿🇼 Zimbabue", dial: "+263" },
];

const COUNTRY_OPTIONS: SelectOption[] = COUNTRIES.map((c) => ({ value: c.code, label: c.label }));

// ── Todos los códigos de teléfono disponibles (independiente del país) ─────────
const PHONE_CODES = [
  { dial: "+1", flag: "🇺🇸", label: "+1 (US/CA)" },
  { dial: "+7", flag: "🇷🇺", label: "+7 (RU)" },
  { dial: "+20", flag: "🇪🇬", label: "+20 (EG)" },
  { dial: "+27", flag: "🇿🇦", label: "+27 (ZA)" },
  { dial: "+30", flag: "🇬🇷", label: "+30 (GR)" },
  { dial: "+31", flag: "🇳🇱", label: "+31 (NL)" },
  { dial: "+32", flag: "🇧🇪", label: "+32 (BE)" },
  { dial: "+33", flag: "🇫🇷", label: "+33 (FR)" },
  { dial: "+34", flag: "🇪🇸", label: "+34 (ES)" },
  { dial: "+36", flag: "🇭🇺", label: "+36 (HU)" },
  { dial: "+39", flag: "🇮🇹", label: "+39 (IT)" },
  { dial: "+40", flag: "🇷🇴", label: "+40 (RO)" },
  { dial: "+41", flag: "🇨🇭", label: "+41 (CH)" },
  { dial: "+44", flag: "🇬🇧", label: "+44 (UK)" },
  { dial: "+45", flag: "🇩🇰", label: "+45 (DK)" },
  { dial: "+46", flag: "🇸🇪", label: "+46 (SE)" },
  { dial: "+47", flag: "🇳🇴", label: "+47 (NO)" },
  { dial: "+48", flag: "🇵🇱", label: "+48 (PL)" },
  { dial: "+49", flag: "🇩🇪", label: "+49 (DE)" },
  { dial: "+51", flag: "🇵🇪", label: "+51 (PE)" },
  { dial: "+52", flag: "🇲🇽", label: "+52 (MX)" },
  { dial: "+53", flag: "🇨🇺", label: "+53 (CU)" },
  { dial: "+54", flag: "🇦🇷", label: "+54 (AR)" },
  { dial: "+55", flag: "🇧🇷", label: "+55 (BR)" },
  { dial: "+56", flag: "🇨🇱", label: "+56 (CL)" },
  { dial: "+57", flag: "🇨🇴", label: "+57 (CO)" },
  { dial: "+58", flag: "🇻🇪", label: "+58 (VE)" },
  { dial: "+60", flag: "🇲🇾", label: "+60 (MY)" },
  { dial: "+61", flag: "🇦🇺", label: "+61 (AU)" },
  { dial: "+62", flag: "🇮🇩", label: "+62 (ID)" },
  { dial: "+63", flag: "🇵🇭", label: "+63 (PH)" },
  { dial: "+64", flag: "🇳🇿", label: "+64 (NZ)" },
  { dial: "+65", flag: "🇸🇬", label: "+65 (SG)" },
  { dial: "+66", flag: "🇹🇭", label: "+66 (TH)" },
  { dial: "+81", flag: "🇯🇵", label: "+81 (JP)" },
  { dial: "+82", flag: "🇰🇷", label: "+82 (KR)" },
  { dial: "+86", flag: "🇨🇳", label: "+86 (CN)" },
  { dial: "+90", flag: "🇹🇷", label: "+90 (TR)" },
  { dial: "+91", flag: "🇮🇳", label: "+91 (IN)" },
  { dial: "+92", flag: "🇵🇰", label: "+92 (PK)" },
  { dial: "+93", flag: "🇦🇫", label: "+93 (AF)" },
  { dial: "+94", flag: "🇱🇰", label: "+94 (LK)" },
  { dial: "+98", flag: "🇮🇷", label: "+98 (IR)" },
  { dial: "+212", flag: "🇲🇦", label: "+212 (MA)" },
  { dial: "+213", flag: "🇩🇿", label: "+213 (DZ)" },
  { dial: "+216", flag: "🇹🇳", label: "+216 (TN)" },
  { dial: "+218", flag: "🇱🇾", label: "+218 (LY)" },
  { dial: "+220", flag: "🇬🇲", label: "+220 (GM)" },
  { dial: "+233", flag: "🇬🇭", label: "+233 (GH)" },
  { dial: "+234", flag: "🇳🇬", label: "+234 (NG)" },
  { dial: "+254", flag: "🇰🇪", label: "+254 (KE)" },
  { dial: "+256", flag: "🇺🇬", label: "+256 (UG)" },
  { dial: "+260", flag: "🇿🇲", label: "+260 (ZM)" },
  { dial: "+263", flag: "🇿🇼", label: "+263 (ZW)" },
  { dial: "+351", flag: "🇵🇹", label: "+351 (PT)" },
  { dial: "+352", flag: "🇱🇺", label: "+352 (LU)" },
  { dial: "+353", flag: "🇮🇪", label: "+353 (IE)" },
  { dial: "+358", flag: "🇫🇮", label: "+358 (FI)" },
  { dial: "+380", flag: "🇺🇦", label: "+380 (UA)" },
  { dial: "+381", flag: "🇷🇸", label: "+381 (RS)" },
  { dial: "+385", flag: "🇭🇷", label: "+385 (HR)" },
  { dial: "+420", flag: "🇨🇿", label: "+420 (CZ)" },
  { dial: "+421", flag: "🇸🇰", label: "+421 (SK)" },
  { dial: "+502", flag: "🇬🇹", label: "+502 (GT)" },
  { dial: "+503", flag: "🇸🇻", label: "+503 (SV)" },
  { dial: "+504", flag: "🇭🇳", label: "+504 (HN)" },
  { dial: "+505", flag: "🇳🇮", label: "+505 (NI)" },
  { dial: "+506", flag: "🇨🇷", label: "+506 (CR)" },
  { dial: "+507", flag: "🇵🇦", label: "+507 (PA)" },
  { dial: "+509", flag: "🇭🇹", label: "+509 (HT)" },
  { dial: "+591", flag: "🇧🇴", label: "+591 (BO)" },
  { dial: "+593", flag: "🇪🇨", label: "+593 (EC)" },
  { dial: "+595", flag: "🇵🇾", label: "+595 (PY)" },
  { dial: "+598", flag: "🇺🇾", label: "+598 (UY)" },
  { dial: "+966", flag: "🇸🇦", label: "+966 (SA)" },
  { dial: "+971", flag: "🇦🇪", label: "+971 (AE)" },
  { dial: "+972", flag: "🇮🇱", label: "+972 (IL)" },
];

const PHONE_CODE_OPTIONS: SelectOption[] = PHONE_CODES.map((p) => ({
  value: p.dial,
  label: `${p.flag} ${p.label}`,
}));

const CNOW = "https://countriesnow.space/api/v0.1";

const AccountDetailsStep = ({ nextStep, prevStep, initialData }: AccountDetailsStepProps) => {
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    city: "",
    postalCode: "",
    phoneCode: "+57",
    phone: "",
    address: "",
    identification: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        country: initialData.country || "",
        state: initialData.department || initialData.state || "",
        city: initialData.city || "",
        postalCode: initialData.postalCode || "",
        phoneCode: initialData.phoneCountryCode || initialData.phoneCode || "+57",
        phone: initialData.phone || "",
        address: initialData.address || "",
        identification: initialData.identification || "",
      });
    }
  }, [initialData]);

  // Fetch states when country changes
  useEffect(() => {
    if (!formData.country) {
      setStates([]);
      return;
    }
    const countryName = COUNTRIES.find((c) => c.code === formData.country)?.name;
    if (!countryName) return;

    setStatesLoading(true);
    setStates([]);
    setFormData((prev) => ({ ...prev, state: "", city: "" }));
    setCities([]);

    fetch(`${CNOW}/countries/states`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    })
      .then((r) => r.json())
      .then((data) => {
        const list: string[] = (data?.data?.states ?? []).map((s: { name: string }) => s.name);
        setStates(list.sort());
      })
      .catch(() => setStates([]))
      .finally(() => setStatesLoading(false));
  }, [formData.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!formData.country || !formData.state) {
      setCities([]);
      return;
    }
    const countryName = COUNTRIES.find((c) => c.code === formData.country)?.name;
    if (!countryName) return;

    setCitiesLoading(true);
    setCities([]);
    setFormData((prev) => ({ ...prev, city: "" }));

    fetch(`${CNOW}/countries/state/cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName, state: formData.state }),
    })
      .then((r) => r.json())
      .then((data) => {
        const list: string[] = data?.data ?? [];
        setCities(list.sort());
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state]);

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.country) e.country = "Selecciona tu país";
    if (!formData.state) e.state = "Selecciona tu departamento/estado";
    if (!formData.city) e.city = "Selecciona tu ciudad";
    if (!formData.phone) e.phone = "El número de teléfono es requerido";
    else if (!/^[\d\s\-()]{6,}$/.test(formData.phone)) e.phone = "Ingresa un número válido";
    if (!formData.address) e.address = "La dirección es requerida";
    else if (formData.address.length < 5) e.address = "Ingresa una dirección más específica";
    if (!formData.identification) e.identification = "La identificación es requerida";
    else if (formData.identification.trim().length < 4)
      e.identification = "Ingresa un número válido (mínimo 4 caracteres)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      nextStep({
        country: formData.country,
        state: formData.state,
        city: formData.city,
        postalCode: formData.postalCode,
        phoneCode: formData.phoneCode,
        phone: formData.phone,
        address: formData.address,
        identification: formData.identification,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <AuthHeading title="Tus datos" subtitle="Los pedimos una sola vez; después los editas en Ajustes." />

      <div className="flex flex-col gap-5">
        <Group label="UBICACIÓN">
          <Field label="País" error={errors.country}>
            <Select<SelectOption>
              options={COUNTRY_OPTIONS}
              value={COUNTRY_OPTIONS.find((o) => o.value === formData.country) ?? null}
              onChange={(opt) => set("country", opt?.value ?? "")}
              placeholder="Selecciona tu país"
              noOptionsMessage={() => "Sin resultados"}
              styles={rsStyles(!!errors.country)}
              menuPortalTarget={document.body}
              isClearable
            />
          </Field>

          <Field label="Departamento / Estado" error={errors.state}>
            <Select<SelectOption>
              options={states.map((s) => ({ value: s, label: s }))}
              value={formData.state ? { value: formData.state, label: formData.state } : null}
              onChange={(opt) => set("state", opt?.value ?? "")}
              isDisabled={!formData.country || statesLoading}
              isLoading={statesLoading}
              placeholder={
                !formData.country ? "Primero selecciona un país" : "Selecciona tu departamento"
              }
              noOptionsMessage={() => "Sin resultados"}
              loadingMessage={() => "Cargando…"}
              styles={rsStyles(!!errors.state)}
              menuPortalTarget={document.body}
              isClearable
            />
          </Field>

          <Field label="Ciudad" error={errors.city} loading={citiesLoading && cities.length === 0}>
            {cities.length > 0 ? (
              <Select<SelectOption>
                options={cities.map((c) => ({ value: c, label: c }))}
                value={formData.city ? { value: formData.city, label: formData.city } : null}
                onChange={(opt) => set("city", opt?.value ?? "")}
                isDisabled={citiesLoading}
                isLoading={citiesLoading}
                placeholder="Selecciona tu ciudad"
                noOptionsMessage={() => "Sin resultados"}
                loadingMessage={() => "Cargando…"}
                styles={rsStyles(!!errors.city)}
                menuPortalTarget={document.body}
                isClearable
              />
            ) : (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder={
                  !formData.state ? "Primero selecciona un departamento" : "Escribe tu ciudad"
                }
                disabled={!formData.state || citiesLoading}
                className={controlClass(!!errors.city)}
              />
            )}
          </Field>

          <Field label="Dirección de residencia" error={errors.address}>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Calle 123 #45-67"
              className={controlClass(!!errors.address)}
            />
          </Field>
        </Group>

        <Group label="CONTACTO E IDENTIFICACIÓN">
          <Field label="Número de teléfono" error={errors.phone}>
            {/* El prefijo arriba y el número debajo, cada uno a todo el ancho: en
                una sola fila el número quedaba en un hueco donde no se leía entero. */}
            <div className="flex flex-col gap-2">
              <Select<SelectOption>
                options={PHONE_CODE_OPTIONS}
                value={PHONE_CODE_OPTIONS.find((o) => o.value === formData.phoneCode) ?? null}
                onChange={(opt) => set("phoneCode", opt?.value ?? "")}
                aria-label="Código de país"
                placeholder="Código"
                noOptionsMessage={() => "Sin resultados"}
                styles={rsStyles(false)}
                menuPortalTarget={document.body}
              />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                aria-label="Número de teléfono"
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="300 123 4567"
                className={controlClass(!!errors.phone)}
              />
            </div>
          </Field>

          <Field
            label="Identificación"
            error={errors.identification}
            help="Cédula, DNI o pasaporte. Solo se usa para verificar los pagos."
          >
            <input
              type="text"
              value={formData.identification}
              onChange={(e) => set("identification", e.target.value)}
              placeholder="Ej: 1234567890 / ABC123456"
              className={controlClass(!!errors.identification)}
            />
          </Field>
        </Group>
      </div>

      <div className="flex gap-3">
        <button onClick={prevStep} className={AUTH_SECONDARY_CLASS}>
          <ArrowLeft className="h-[15px] w-[15px]" />
          Atrás
        </button>
        <button onClick={handleSubmit} className={AUTH_SUBMIT_CLASS}>
          Continuar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/** Clases del control sobre el vidrio; se resalta en rojo cuando el campo tiene error. */
const controlClass = (hasError: boolean) =>
  `auth-input h-[46px] w-full rounded-[14px] border bg-black/[0.22] px-3.5 text-[13px] text-white placeholder:text-white/40 transition-colors focus:outline-none focus:ring-[3px] disabled:opacity-50 ${
    hasError
      ? "border-[#FF8F92]/80 focus:ring-[#E5484D]/20"
      : "border-white/[0.16] focus:border-[#FF8A3D] focus:ring-[#FF5C00]/25"
  }`;

/**
 * Estilos de react-select equivalentes a `controlClass`. El menú se abre opaco
 * en el tono de la noche, como en el resto del vidrio: translúcido, el texto de
 * las opciones se mezclaría con los campos de debajo.
 */
const rsStyles = (hasError: boolean): StylesConfig<SelectOption, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hasError ? "rgba(255, 143, 146, 0.8)" : state.isFocused ? "#FF8A3D" : "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${hasError ? "rgba(229, 72, 77, 0.2)" : "rgba(255, 92, 0, 0.25)"}`
      : "none",
    opacity: state.isDisabled ? 0.5 : 1,
    cursor: "pointer",
    transition: "border-color 150ms, box-shadow 150ms",
    "&:hover": { borderColor: hasError ? "rgba(255, 143, 146, 0.8)" : "rgba(255, 255, 255, 0.28)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 14px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: 13, color: "#FFFFFF" }),
  singleValue: (base) => ({ ...base, fontSize: 13, color: "#FFFFFF" }),
  placeholder: (base) => ({ ...base, fontSize: 13, color: "rgba(255, 255, 255, 0.4)" }),
  menu: (base) => ({
    ...base,
    marginTop: 6,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#2B1E17",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 20px 44px -12px rgba(0, 0, 0, 0.6)",
  }),
  menuList: (base) => ({ ...base, padding: 4 }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    borderRadius: 8,
    cursor: "pointer",
    backgroundColor: state.isSelected ? "#FF5C00" : state.isFocused ? "rgba(255, 255, 255, 0.08)" : "transparent",
    color: state.isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
    ":active": { backgroundColor: state.isSelected ? "#FF5C00" : "rgba(255, 92, 0, 0.22)" },
  }),
  noOptionsMessage: (base) => ({ ...base, fontSize: 12.5, color: "rgba(255, 255, 255, 0.5)" }),
  loadingMessage: (base) => ({ ...base, fontSize: 12.5, color: "rgba(255, 255, 255, 0.5)" }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "rgba(255, 255, 255, 0.45)" }),
  clearIndicator: (base) => ({ ...base, color: "rgba(255, 255, 255, 0.45)" }),
  loadingIndicator: (base) => ({ ...base, color: "rgba(255, 255, 255, 0.45)" }),
});

/** Bloque de campos con su encabezado. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[10px] font-medium tracking-[1.3px] text-white/50">{label}</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  help?: string;
  loading?: boolean;
  children: React.ReactNode;
}

/** Campo con etiqueta, indicador de carga y error debajo del control. */
function Field({ label, error, help, loading, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="pl-1 text-[12px] font-semibold text-white/80">
        {label} <span className="text-[#FF8F92]">*</span>
      </label>
      <div className="relative">
        {children}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/50" />
        )}
      </div>
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 pl-1 text-[11.5px] leading-snug text-[#FF8F92]">
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      ) : (
        help && <p className="pl-1 text-[11px] leading-snug text-white/50">{help}</p>
      )}
    </div>
  );
}

export default AccountDetailsStep;
