import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
Você é um Instrutor Sênior de Usinagem e Manutenção Industrial do SENAI (Serviço Nacional de Aprendizagem Industrial).
Seu objetivo é auxiliar alunos, docentes e técnicos da Célula 1.A.

Responda dúvidas sobre:
1. Parâmetros de corte (velocidade de corte Vc, avanço f, RPM n = (Vc * 1000) / (π * D)) para materiais comuns (Aço 1020, 1045, Alumínio, Latão, Ferro Fundido).
2. Procedimentos de manutenção preventiva e corretiva em Tornos CNC Romi T240, Tornos Nardini MC220AE, Fresadoras Universal, Retífica Ferdimat, Serras de Fita e Moto Esmeris.
3. Normas de segurança (NR-12) e EPIs necessários (óculos, protetor auricular, calçado com biqueira, sem anéis/pulseiras).
4. Lubrificação industrial (óleo ISO VG 68 para barramentos, VG 32 para hidráulicos, graxa à base de lítio).
5. Programação CNC (G-Code padrão ISO: G00, G01, G02, G03, G71, G70, etc.).

Estilo de resposta:
- Técnico, didático, objetivo e acessível.
- Use listas e negrito.
- Priorize sempre a segurança operacional (NR-12).
`;

function getOfflineTechnicalAnswer(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('rpm') || p.includes('rotação') || p.includes('formula') || p.includes('fórmula')) {
    return `**Fórmula de Rotação (RPM - SENAI Célula 1.A):**

$$\\text{n} = \\frac{\\text{Vc} \\times 1000}{\\pi \\times \\text{D}}$$

- **n**: Rotação da árvore (RPM)
- **Vc**: Velocidade de corte em metros por minuto (m/min)
- **D**: Diâmetro da peça ou da ferramenta fresa (mm)
- **π**: Aproximadamente 3,1416

**Exemplo Prático (Aço 1020 em Torno, D = 50 mm, Ferramenta de Metal Duro Vc = 180 m/min):**
$$\\text{n} = \\frac{180 \\times 1000}{3.1416 \\times 50} \\approx 1146 \\text{ RPM}$$

*Dica de Segurança NR-12:* Sempre verifique a fixação da placa e da castanha antes de acionar a rotação.`;
  }

  if (p.includes('1020') || p.includes('1045') || p.includes('avanço') || p.includes('velocidade') || p.includes('corte')) {
    return `**Parâmetros de Corte Recomendados (SENAI Célula 1.A):**

1. **Aço SAE 1020 (Metal Duro / Inserto):**
   - **Vc Desbaste:** 160 – 220 m/min | **Avanço (f):** 0,20 – 0,35 mm/rot
   - **Vc Acabamento:** 200 – 280 m/min | **Avanço (f):** 0,08 – 0,15 mm/rot
2. **Aço SAE 1045 (Metal Duro):**
   - **Vc Desbaste:** 130 – 180 m/min | **Avanço (f):** 0,18 – 0,30 mm/rot
   - **Vc Acabamento:** 160 – 220 m/min | **Avanço (f):** 0,08 – 0,12 mm/rot
3. **Alumínio:**
   - **Vc:** 300 – 600 m/min | **Avanço (f):** 0,15 – 0,40 mm/rot (Refrigeração abundante)
4. **Latão / Bronze:**
   - **Vc:** 180 – 300 m/min | **Avanço (f):** 0,10 – 0,25 mm/rot

*Atenção:* Ajuste a profundidade de corte (ap) conforme a rigidez da máquina e potência do motor.`;
  }

  if (p.includes('segurança') || p.includes('nr-12') || p.includes('nr12') || p.includes('epi')) {
    return `**Normas de Segurança NR-12 - Oficina Célula 1.A:**

- **EPIs Obrigatórios:**
  - Óculos de segurança com proteção lateral (norma ANSI/CA).
  - Protetor auricular (tipo plugue ou concha).
  - Botina de segurança com biqueira de proteção.
  - Guarda-pó com mangas ajustadas ou camiseta justa por dentro da calça.
- **Proibições Estritas:**
  - Proibido o uso de luvas na operação de máquinas rotativas (Tornos, Furadeiras, Fresadoras).
  - Proibido o uso de anéis, correntes, pulseiras, relógios ou crachá pendurado.
  - Cabelos compridos devem estar rigidamente presos.
- **Procedimentos:**
  - Nunca retire cavacos com as mãos — utilize sempre gancho limpador e pincel apropriado.
  - Teste o botão de emergência (cogumelo) antes de iniciar qualquer operação.`;
  }

  if (p.includes('lubrific') || p.includes('óleo') || p.includes('graxa') || p.includes('barramento')) {
    return `**Guia de Lubrificação - Célula 1.A SENAI:**

- **Guias e Barramentos (Tornos e Fresadoras):**
  - Óleo **ISO VG 68** com aditivo de adesividade e extrema pressão (anti-stick-slip).
- **Caixas de Engrenagem e Cabeçotes:**
  - Óleo mineral industrial **ISO VG 46** ou **VG 68**, conforme especificação do fabricante.
- **Sistemas Hidráulicos (Torno CNC ROMI T240):**
  - Óleo hidráulico **ISO VG 32** ou **VG 46**. Verifique o nível do reservatório diariamente.
- **Mancais e Rolamentos com Engraxadeira:**
  - Graxa à base de sabão de lítio consistência **NLGI 2**.
- **Fluido de Corte / Emulsão Refrigerante:**
  - Óleo solúvel semi-sintético em concentração de 6% a 8% (medir semanalmente com refratômetro).`;
  }

  if (p.includes('cnc') || p.includes('romi') || p.includes('g-code') || p.includes('código g')) {
    return `**Códigos G Principais (Comando CNC Fanuc / Siemens - ROMI T240):**

- **G00:** Posicionamento rápido (não usinar em avanço rápido!).
- **G01:** Interpolação linear com avanço programado (F).
- **G02 / G03:** Interpolação circular horária / anti-horária.
- **G28 / G53:** Retorno ao ponto de referência da máquina.
- **G71:** Ciclo automático de desbaste longitudinal em torneamento.
- **G70:** Ciclo de acabamento.
- **G76:** Ciclo automático de abertura de roscas.
- **M03 / M04:** Sentido de giro da placa (horário / anti-horário).
- **M08 / M09:** Liga / Desliga refrigeração de corte.

*Dica de Prática:* Sempre simule o gráfico no comando e teste o bloco a bloco (Single Block) na primeira peça.`;
  }

  return `**Orientação Técnica SENAI Célula 1.A:**

Para a operação eficiente e segura dos tornos, fresadoras e retíficas da célula:
1. **Verificação Pré-Operacional:** Realize a inspeção visual e complete o checklist de segurança NR-12.
2. **Parâmetros Técnicos:** Calcule a rotação através de $n = \\frac{Vc \\times 1000}{\\pi \\times D}$ e selecione o avanço adequado ao material.
3. **Fluido e Lubrificação:** Mantenha os níveis de óleo de barramento abastecidos antes de ligar a máquina.
4. **Dúvidas Adicionais:** Você pode perguntar sobre:
   - Parâmetros para Aço 1020 / 1045 / Alumínio
   - Códigos G para o Torno CNC ROMI T240
   - Procedimentos de segurança NR-12 e EPIs`;
}

export const askTechnicalAssistant = async (prompt: string): Promise<string> => {
  if (!apiKey || !ai) {
    // Graceful intelligent offline domain response for workshops
    return getOfflineTechnicalAnswer(prompt);
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    return response.text || getOfflineTechnicalAnswer(prompt);
  } catch (error) {
    console.error("Gemini API Error, falling back to local technical knowledge:", error);
    return getOfflineTechnicalAnswer(prompt);
  }
};