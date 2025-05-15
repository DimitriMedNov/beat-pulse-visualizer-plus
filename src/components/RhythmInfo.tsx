
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface RhythmInfoProps {
  rhythmType: string;
}

export default function RhythmInfo({ rhythmType }: RhythmInfoProps) {
  const getRhythmInfo = () => {
    switch (rhythmType) {
      case "normal":
        return {
          title: "Ritmo Normal",
          description: "60-100 latidos por minuto",
          content: "El ritmo cardíaco normal muestra un patrón regular con ondas P-QRS-T bien definidas. El corazón bombea sangre de manera uniforme y eficiente, manteniendo una buena perfusión en todo el cuerpo.",
          icon: Heart,
          color: "text-medical-normal"
        };
      case "bradycardia":
        return {
          title: "Bradicardia",
          description: "Menos de 60 latidos por minuto",
          content: "La bradicardia es un ritmo cardíaco anormalmente lento. Puede ser normal en atletas en reposo, pero también puede indicar problemas con el sistema de conducción eléctrica del corazón o efectos de ciertos medicamentos.",
          icon: Heart,
          color: "text-medical-bradycardia"
        };
      case "tachycardia":
        return {
          title: "Taquicardia",
          description: "Más de 100 latidos por minuto",
          content: "La taquicardia es un ritmo cardíaco anormalmente rápido. Puede ser causada por estrés, ejercicio, fiebre, medicamentos, o problemas cardíacos. Un ritmo cardíaco sostenidamente rápido puede reducir la eficiencia del bombeo.",
          icon: Heart,
          color: "text-medical-tachycardia"
        };
      case "arrhythmia":
        return {
          title: "Arritmia",
          description: "Ritmo cardíaco irregular",
          content: "Las arritmias son alteraciones en el ritmo normal del corazón. Pueden manifestarse como latidos irregulares, demasiado rápidos, demasiado lentos o una combinación. Algunas arritmias son inofensivas, mientras otras pueden ser graves o incluso potencialmente mortales.",
          icon: Heart,
          color: "text-medical-arrhythmia"
        };
      default:
        return {
          title: "Seleccione un ritmo",
          description: "Información no disponible",
          content: "Seleccione un tipo de ritmo cardíaco para ver su información.",
          icon: Heart,
          color: "text-gray-500"
        };
    }
  };

  const info = getRhythmInfo();
  const Icon = info.icon;

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader className="flex flex-row items-center gap-2">
        <Icon className={cn("h-5 w-5", info.color)} />
        <div>
          <CardTitle>{info.title}</CardTitle>
          <CardDescription>{info.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{info.content}</p>
      </CardContent>
    </Card>
  );
}

// Helper for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
