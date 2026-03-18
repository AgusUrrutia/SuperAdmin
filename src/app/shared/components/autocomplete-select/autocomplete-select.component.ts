import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type AnyObj = Record<string, any>;

@Component({
    selector: 'app-autocomplete-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './autocomplete-select.component.html',
    styleUrl: './autocomplete-select.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutocompleteSelectComponent),
            multi: true
        }
    ]
})
export class AutocompleteSelectComponent implements ControlValueAccessor {
    private _options: Array<string | AnyObj> = [];
    @Input()
    set options(val: Array<string | AnyObj>) {
        this._options = val || [];
        this.filterNow();
        this.syncInputFromValue();
    }
    get options(): Array<string | AnyObj> { return this._options; }

    @Input() valueKey = 'id';
    @Input() displayKey = 'label';
    @Input() placeholder = 'Seleccionar...';
    @Input() disabled = false;
    @Input() clearable = true;
    @Input() maxVisible = 200;
    @Input() invalid = false;
    @Input() errorMessage: string | null = null;

    @Output() valueChange = new EventEmitter<any>();
    @Output() selectedStatusChange = new EventEmitter<any>();

    isOpen = false;
    inputText = '';
    filtered: Array<string | AnyObj> = [];
    highlightedIndex = -1;

    private _value: any = null;
    private onChange: (v: any) => void = () => { };
    private onTouched: () => void = () => { };

    selected = false;

    constructor(private host: ElementRef<HTMLElement>, private cdRef: ChangeDetectorRef) { }

    writeValue(value: any): void {
        this._value = value;
        this.syncInputFromValue();
    }

    private syncInputFromValue() {
        const opt = this.findByValue(this._value);
        if (opt) {
            this.inputText = this.getLabel(opt);
            this.selected = true;
            this.selectedStatusChange.emit(this.selected);
        } else {
            if (this._value == null || this._value === '') {
                this.inputText = '';
                this.selected = false;
                this.selectedStatusChange.emit(this.selected);
            }
        }
        this.cdRef.detectChanges();
    }

    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
    setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

    trackByVal = (index: number, o: string | AnyObj) => {
        const v = this.getValue(o);
        return v != null ? v : index;
    };

    onInputFocus(): void {
        if (this.disabled) return;
        this.isOpen = true;
        this.filterNow();
    }

    onInputChange(): void {
        this.isOpen = true;
        this.filterNow();
    }

    onClear(e: MouseEvent): void {
        e.stopPropagation();
        this.setValue(null, '');
        this.isOpen = false;
    }

    selectOption(opt: string | AnyObj): void {
        const val = this.getValue(opt);
        const label = this.getLabel(opt);
        this.setValue(val, label);
        this.selected = true;
        this.selectedStatusChange.emit(this.selected);
        this.close();
    }

    private setValue(val: any, label: string) {
        this._value = val;
        this.inputText = label;
        this.onChange(val);
        this.valueChange.emit(val);
    }

    private close() {
        this.isOpen = false;
        this.highlightedIndex = -1;
        this.onTouched();
    }

    private filterNow() {
        this.selected = false;
        this.selectedStatusChange.emit(this.selected);
        const q = (this.inputText || '').toLowerCase().trim();
        const base = this.options || [];
        let res = base;

        if (q) {
            res = base.filter(o => this.getLabel(o).toLowerCase().includes(q));
        }
        this.filtered = res.slice(0, this.maxVisible);
        this.highlightedIndex = this.filtered.length ? 0 : -1;

        if (this.filtered.length == 1 && this.getLabel(this.filtered[0]).toLowerCase() === q.toLowerCase()) {
            this.selectOption(this.filtered[0]);
        }
    }

    getLabel(o: string | AnyObj): string {
        return typeof o === 'string' ? o : (o?.[this.displayKey] ?? '');
    }
    getValue(o: string | AnyObj): any {
        return typeof o === 'string' ? o : o?.[this.valueKey];
    }
    findByValue(val: any): string | AnyObj | undefined {
        if (val == null) return undefined;
        return this.options.find(o => this.getValue(o) === val);
    }

    onKeyDown(e: KeyboardEvent) {
        if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            this.isOpen = true;
            this.filterNow();
        }
        if (!this.isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.filtered.length) {
                this.highlightedIndex = (this.highlightedIndex + 1) % this.filtered.length;
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.filtered.length) {
                this.highlightedIndex = (this.highlightedIndex - 1 + this.filtered.length) % this.filtered.length;
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlightedIndex >= 0 && this.filtered[this.highlightedIndex]) {
                this.selectOption(this.filtered[this.highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            this.close();
        }
    }

    @HostListener('document:click', ['$event'])
    onDocClick(ev: MouseEvent) {
        if (!this.host.nativeElement.contains(ev.target as Node)) {
            this.close();
        }
    }
}
