// Icono de línea para cada actividad (texto libre en español que llega del catálogo).
import type { ComponentType } from 'react';
import { CultureIcon, FoodIcon, LodgingIcon, RouteIcon } from '../brand/icons';
import { BikeIcon, BirdIcon, CameraIcon, MountainIcon, StarIcon, TentIcon, UsersIcon, WavesIcon } from './LineIcons';

type IconType = ComponentType<{ className?: string }>;

const RULES: Array<[RegExp, IconType]> = [
  [/hosped|hotel|caba[ñn]a|habitaci|posada|lodging/i, LodgingIcon],
  [/restaur|cocina|comida|gastro|antojit|food/i, FoodIcon],
  [/gu[ií]a|tour|guide|cooperativ/i, UsersIcon],
  [/foto/i, CameraIcon],
  [/\baves?\b|pajar|birdwatch|guacamaya|vencejo/i, BirdIcon],
  [/r[ií]o|nado|nadar|poza|cascada|agua|kayak|rafting|ca[ñn]onismo|baño|bañ/i, WavesIcon],
  [/campa|acampar|campismo|camping/i, TentIcon],
  [/bici|ciclis|bike/i, BikeIcon],
  [/rappel|escalada|mirador|cumbre|monta[ñn]/i, MountainIcon],
  [/misi[oó]n|histor|arquitect|templo|zona arqueol|arte|cultur|visita guiada|recorrido hist/i, CultureIcon],
  [/gastro|comida|cocina|degusta|mezcal|vino|caf[eé]/i, FoodIcon],
  [/sender|camina|hiking|recorrido|trek|ruta/i, RouteIcon],
];

export const activityIcon = (tag: string): IconType => RULES.find(([pattern]) => pattern.test(tag))?.[1] ?? StarIcon;
