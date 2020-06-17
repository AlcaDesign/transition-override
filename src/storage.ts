import { Connection } from './types';

interface TOStorage {
	get(key: 'connections'): Connection[] | null;
	set(key: 'connections', value: Connection[]): boolean;
}

interface BaseItem {
	// eslint-disable-next-line
	value: any;
}

class TOStorage {
	prefix = 'alca_obs-to_';
	get(key: string) {
		const json = localStorage.getItem(this.prefix + key);
		if(json !== null) {
			let data: BaseItem = { value: null };
			try {
				data = JSON.parse(json);
			// eslint-disable-next-line
			} catch {}
			if(data.value !== undefined) {
				return data.value;
			}
		}
		return null;
	}
	// eslint-disable-next-line
	set(key: string, value: any) {
		let json = null;
		try {
			json = JSON.stringify({ value });
		} catch {
			return false;
		}
		if(json) {
			localStorage.setItem(this.prefix + key, json);
			return true;
		}
		return false;
	}
	remove(key: string) {
		return localStorage.removeItem(this.prefix + key);
	}
	// eslint-disable-next-line
	remember(key: string, value: any) {
		const existing = this.get(key);
		if(existing === null) {
			this.set(key, value);
			return value;
		}
		return existing;
	}
}

export default new TOStorage();