import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizQuestionProps {
  questionNumber: number;
  questionText: string;
  options: Array<{
    text: string;
    isCorrect?: boolean;
    explanation?: string;
  }>;
  selectedOption?: number;
  onSelectOption: (optionIndex: number) => void;
  showResults?: boolean;
}

export function QuizQuestion({
  questionNumber,
  questionText,
  options,
  selectedOption,
  onSelectOption,
  showResults = false,
}: QuizQuestionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {questionNumber}. {questionText}
      </h3>

      <RadioGroup
        value={selectedOption?.toString()}
        onValueChange={(value) => onSelectOption(parseInt(value))}
      >
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = option.isCorrect;
            const showCorrectness = showResults && isSelected;

            return (
              <div
                key={index}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  showCorrectness
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${questionNumber}-${index}`}
                  disabled={showResults}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`option-${questionNumber}-${index}`}
                    className="cursor-pointer"
                  >
                    {option.text}
                  </Label>
                  {showResults && isSelected && option.explanation && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      {option.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
