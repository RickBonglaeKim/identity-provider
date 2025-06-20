import {
  child,
  childArtBonbon,
} from 'libs/persistence/database-schema/main/schema';

export type SelectChildWithChildArtBonBon = {
  child: typeof child.$inferSelect;
  childArtBonbon: typeof childArtBonbon.$inferSelect | null;
};
