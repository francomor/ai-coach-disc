import base64
import io

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import AIMessage, HumanMessage, SystemMessage

load_dotenv()

from pdf2image import convert_from_path
context = """
Este GPT es un Coach Certificado en la Metodología PPA DISC de Thomas International.

Recuerda que en la metodología DISC, los factores nunca son "medios". Son altos o bajos. Incluso si se encuentra sobre la línea, no son medios, en ese caso son altos. Lo que puede variar es la intensidad, más a los extremos es más intenso, ya sea en bajo o en alto. Más al medio es moderado o leve, ya sea una valuación del factor alta o baja.

Funciones:
- Intepretación de imágenes de gráficos DISC: Identificar los puntos: 1. Observar primero dónde cada uno de los puntos se ubica en el gráfico bajo las letras D, I, S, y C. Cada letra representa una de las dimensiones del perfil DISC. 2. Niveles de intensidad: Determinar la intensidad de cada factor observando qué tan lejos está el punto de la línea media del gráfico (que normalmente está marcada y divide el gráfico en una zona superior y una zona inferior). 3. Alta o Baja: Alta: Si el punto se encuentra en la mitad superior del gráfico, la característica es alta. Baja: Si el punto se encuentra en la mitad inferior del gráfico, la característica es baja. 4. Intensidad de la característica: Leve: Si el punto está cerca de la línea media, la intensidad es leve. Moderada: Si el punto está a una distancia equidistante de la línea media y el extremo del gráfico, la intensidad es moderada. Importante/Alta: Si el punto está en el extremo superior o inferior del gráfico, la intensidad es importante o alta. 5. Zona gris: Si la característica se encuentra en una zona sombreada o de otro color, que normalmente denota una intensidad especialmente destacable o significativa. 6. Verificación contra la zona gris: Si alguna de las características entra en una zona gris o sombreada, prestar especial atención a esta característica, ya que indica un aspecto muy fuerte o posiblemente una sobrecompensación en esa área. 7. Comparación con la descripción estándar: Una vez identificados los niveles de cada factor y sus intensidades, compararlos con las descripciones estándar de comportamiento asociadas con cada dimensión DISC para interpretar correctamente.


Dada la siguiente imagen que es parte del ANÁLISIS DE PERFIL PERSONAL, resumir el texto de la pagina. La respuesta debe responder solo al siguiente JSON:

{
    "Nombre_persona": "",
    "Autoimagen": {
        "Descripcion": "",
        "Grafica III": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Automotivacion": "",
    "Enfasis laboral": "",
    "Palabras descriptivas": "",
    "Como lo ven otros": {
        "Descripcion": "",
        "Grafica I": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Comportamiento bajo presion": {
        "Descripcion": "",
        "Grafica I": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Comentarios generales": "",
    "Factores de motivacion": "",
}

"""

pages = convert_from_path('disc_data/DISC LANG-1.pdf', fmt='png')
print(len(pages))

responses = []
for page in pages:
    buffer = io.BytesIO()
    print(page)
    page.save(buffer, format='png')
    content = base64.b64encode(buffer.getbuffer().tobytes()).decode('utf-8')

    model = ChatOpenAI(temperature=0, model="gpt-4-vision-preview")
    msg = model.invoke([HumanMessage(content=[
        {"type": "text", "text": context},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{content}"}},
    ])])
    print(msg.content)
    buffer.close()
    responses.append(msg.content)

print(responses)

prompt_2 = """
Basado en los JSON proporcionados, juntar la informacion en un solo JSON con el siguiente formato"

{
    "Nombre_persona": "",
    "Autoimagen": {
        "Descripcion": "",
        "Grafica III": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Automotivacion": "",
    "Enfasis laboral": "",
    "Palabras descriptivas": "",
    "Como lo ven otros": {
        "Descripcion": "",
        "Grafica I": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Comportamiento bajo presion": {
        "Descripcion": "",
        "Grafica I": {
            "D": "",
            "I": "",
            "S": "",
            "C": "",
        }
    },
    "Comentarios generales": "",
    "Factores de motivacion": "",
}
"""

print("/n".join(responses))
model = ChatOpenAI(temperature=0, model="gpt-4")
msg = model.invoke([HumanMessage(content=[
    {"type": "text", "text": prompt_2},
    {"type": "text", "text": "/n".join(responses)},
])])

print("Respuesta final")
print(msg.content)
