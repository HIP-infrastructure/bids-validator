import {
  Context,
  ContextDataset,
  ContextDatasetSubjects,
  ContextSubject,
  ContextAssociations,
  ContextNiftiHeader,
} from '../types/context.ts'
import { BIDSFile } from '../types/file.ts'
import { FileTree } from '../types/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { parseTSV } from '../files/tsv.ts'
import { loadHeader } from '../files/nifti.ts'
import { buildAssociations } from './associations.ts'

class BIDSContextDataset implements ContextDataset {
  dataset_description: object
  files: any[]
  tree: object
  ignored: any[]
  modalities: any[]
  subjects: ContextDatasetSubjects[]

  constructor() {
    this.dataset_description = {}
    this.files = []
    this.tree = {}
    this.ignored = []
    this.modalities = []
    this.subjects = [] as ContextDatasetSubjects[]
  }
}

const contextDataset = new BIDSContextDataset()

export class BIDSContext implements Context {
  // Internal representation of the file tree
  #fileTree: FileTree
  issues: DatasetIssues
  file: BIDSFile
  suffix: string
  extension: string
  entities: Record<string, string>
  dataset: ContextDataset
  subject: ContextSubject
  datatype: string
  modality: string
  sidecar: object
  columns: Record<string, string[]>
  associations: ContextAssociations
  nifti_header?: ContextNiftiHeader

  constructor(fileTree: FileTree, file: BIDSFile, issues: DatasetIssues) {
    this.#fileTree = fileTree
    this.issues = issues
    this.file = file
    const bidsEntities = readEntities(file)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
    this.dataset = contextDataset
    this.subject = {} as ContextSubject
    this.datatype = ''
    this.modality = ''
    this.sidecar = {}
    this.columns = {}
    this.associations = {} as ContextAssociations
  }

  get json(): Promise<Record<string, any>> {
    return this.file
      .text()
      .then((text) => JSON.parse(text))
      .catch((error) => {})
  }
  get path(): string {
    return this.datasetPath
  }

  /**
   * Implementation specific absolute path for the dataset root
   *
   * In the browser, this is always at the root
   */
  get datasetPath(): string {
    return this.#fileTree.path
  }

  /**
   * Crawls fileTree from root to current context file, loading any valid
   * json sidecars found.
   */
  async loadSidecar(fileTree?: FileTree) {
    if (!fileTree) {
      fileTree = this.#fileTree
    }
    const validSidecars = fileTree.files.filter((file) => {
      const { suffix, extension, entities } = readEntities(file)
      return (
        extension === '.json' &&
        suffix === this.suffix &&
        Object.keys(entities).every((entity) => {
          return (
            entity in this.entities &&
            entities[entity] === this.entities[entity]
          )
        })
      )
    })
    if (validSidecars.length > 1) {
      // two matching in one dir not allowed
    } else if (validSidecars.length === 1) {
      const json = await validSidecars[0]
        .text()
        .then((text) => JSON.parse(text))
        .catch((error) => {})
      this.sidecar = { ...this.sidecar, ...json }
    }
    const nextDir = fileTree.directories.find((directory) => {
      return this.file.path.startsWith(directory.path)
    })
    if (nextDir) {
      await this.loadSidecar(nextDir)
    }
  }

  loadNiftiHeader(): Promise<void> {
    if (this.extension.startsWith('.nii')) {
      this.nifti_header = loadHeader(this.file as BIDSFileDeno)
    }
    return Promise.resolve()
  }

  async loadColumns(): Promise<void> {
    if (this.extension !== '.tsv') {
      return
    }
    this.columns = await this.file
      .text()
      .then((text) => parseTSV(text))
      .catch((error) => {
        console.log(error)
        return {}
      })
    return
  }

  async loadAssociations(): Promise<void> {
    this.associations = await buildAssociations(this.#fileTree, this)
    return
  }

  async asyncLoads() {
    await Promise.allSettled([
      this.loadSidecar(),
      this.loadColumns(),
      this.loadAssociations(),
    ])
    this.loadNiftiHeader()
  }
}
