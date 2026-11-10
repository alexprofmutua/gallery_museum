import { useId } from "react";
import { Star, Waves } from "lucide-react";
import { characterIds, characters } from "../../content/characters";
import type { CharacterId } from "../../content/characters";

export function CharacterPicker({
  selected,
  onChange,
}: {
  selected: CharacterId;
  onChange: (character: CharacterId) => void;
}) {
  const name = useId();
  return (
    <fieldset className="character-picker">
      <legend>Choose your visitor identity</legend>
      <div className="character-options">
        {characterIds.map((id) => {
          const Icon = id === "starfish" ? Star : Waves;
          return (
            <label
              className={`character-option character-option--${id}`}
              key={id}
            >
              <input
                type="radio"
                name={name}
                value={id}
                checked={selected === id}
                onChange={() => onChange(id)}
              />
              <span>
                <Icon size={18} aria-hidden="true" /> {characters[id].name}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
