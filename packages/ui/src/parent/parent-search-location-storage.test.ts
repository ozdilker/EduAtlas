import { afterEach, describe, expect, it, vi } from "vitest";

describe("parent search location storage", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  async function loadWithStorageMock() {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    };
    const listeners = new Map<string, Set<EventListener>>();
    const windowMock = {
      localStorage,
      addEventListener: (type: string, listener: EventListener) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, listener: EventListener) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        for (const listener of listeners.get(event.type) ?? []) {
          listener(event);
        }
        return true;
      },
    };
    vi.stubGlobal("window", windowMock);
    return import("./parent-search-location-storage");
  }

  it("stores and reads last search city id", async () => {
    const {
      SEARCH_LOCATION_STORAGE_KEY,
      getLastSearchCityId,
      setLastSearchCityId,
    } = await loadWithStorageMock();
    setLastSearchCityId("istanbul");
    expect(getLastSearchCityId()).toBe("istanbul");
    expect(window.localStorage.getItem(SEARCH_LOCATION_STORAGE_KEY)).toBe("istanbul");
  });

  it("clears storage when city is empty", async () => {
    const { getLastSearchCityId, setLastSearchCityId } = await loadWithStorageMock();
    setLastSearchCityId("ankara");
    setLastSearchCityId("");
    expect(getLastSearchCityId()).toBeNull();
  });

  it("dispatches change event", async () => {
    const {
      SEARCH_LOCATION_CHANGED_EVENT,
      setLastSearchCityId,
    } = await loadWithStorageMock();
    const handler = vi.fn();
    window.addEventListener(SEARCH_LOCATION_CHANGED_EVENT, handler);
    setLastSearchCityId("izmir");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
