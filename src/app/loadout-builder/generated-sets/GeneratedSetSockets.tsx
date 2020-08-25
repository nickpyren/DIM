import React, { Dispatch } from 'react';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  LockedArmor2Mod,
  ModPickerCategory,
  ModPickerCategories,
  isModPickerCategory,
} from '../types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import GeneratedSetMod from './GeneratedSetMod';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import styles from './GeneratedSetSockets.m.scss';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { getSpecialtySocketMetadataByPlugCategoryHash } from 'app/utils/item-utils';
import { Armor2ModPlugCategoriesTitles } from '../utils';

const undesireablePlugs = [
  PlugCategoryHashes.ArmorSkinsEmpty,
  PlugCategoryHashes.Shader,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance1,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance3,
  PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance4,
];

interface PlugAndCategory {
  plugDef: PluggableInventoryItemDefinition;
  category?: ModPickerCategory;
  season?: number;
}

interface Props {
  item: DimItem;
  lockedMods: LockedArmor2Mod[];
  defs: D2ManifestDefinitions;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

function GeneratedSetSockets({ item, lockedMods, defs, lbDispatch }: Props) {
  if (!item.isDestiny2()) {
    return null;
  }

  const modsAndPerks: PlugAndCategory[] = [];
  const modsToUse = [...lockedMods];

  for (const socket of item.sockets?.allSockets || []) {
    const socketType = defs.SocketType.get(socket.socketDefinition.socketTypeHash);
    let toSave: DestinyInventoryItemDefinition | undefined;

    for (let modIndex = 0; modIndex < modsToUse.length; modIndex++) {
      const mod = modsToUse[modIndex].mod;
      if (
        socketType.plugWhitelist.some((plug) => plug.categoryHash === mod.plug.plugCategoryHash)
      ) {
        toSave = mod;
        modsToUse.splice(modIndex, 1);
      }
    }

    if (!toSave && socket.socketDefinition.singleInitialItemHash) {
      toSave = defs.InventoryItem.get(socket.socketDefinition.singleInitialItemHash);
    }

    if (
      toSave &&
      isPluggableItem(toSave) &&
      !undesireablePlugs.includes(toSave.plug.plugCategoryHash)
    ) {
      const metadata = getSpecialtySocketMetadataByPlugCategoryHash(toSave.plug.plugCategoryHash);
      const category =
        (isModPickerCategory(toSave.plug.plugCategoryHash) && toSave.plug.plugCategoryHash) ||
        (metadata && ModPickerCategories.seasonal) ||
        undefined;

      modsAndPerks.push({ plugDef: toSave, category, season: metadata?.season });
    }
  }

  return (
    <>
      <div className={styles.lockedItems}>
        {modsAndPerks.map(({ plugDef, category, season }, index) => (
          <GeneratedSetMod
            key={index}
            gridColumn={(index % 2) + 1}
            plugDef={plugDef}
            defs={defs}
            onClick={
              category
                ? () =>
                    lbDispatch({
                      type: 'openModPicker',
                      initialQuery:
                        category === ModPickerCategories.seasonal
                          ? season?.toString()
                          : Armor2ModPlugCategoriesTitles[category],
                    })
                : undefined
            }
          />
        ))}
      </div>
    </>
  );
}

export default GeneratedSetSockets;
