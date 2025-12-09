/// <reference types="react" />

declare global {
	interface Window {
		location: Location;
	}

	interface HTMLFormElement extends Element {
		elements: HTMLFormControlsCollection;
		requestSubmit(): void;
	}

	interface HTMLTextAreaElement extends HTMLElement {
		value: string;
		form: HTMLFormElement | null;
	}

	interface HTMLFormControlsCollection {
		namedItem(name: string): HTMLElement | null;
	}
}

export {};
